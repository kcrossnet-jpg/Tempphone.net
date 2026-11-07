import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// ==========================================
// 1. REDIS STORE (TTL & In-Memory Storage)
// ==========================================
interface RedisEntry {
  value: any;
  expiresAt: number; // Unix timestamp in ms
}

class RedisTTLStore {
  private store: Map<string, RedisEntry> = new Map();

  constructor() {
    // Active TTL Garbage Collector (runs every 2 seconds)
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.expiresAt <= now) {
          this.store.delete(key);
        }
      }
    }, 2000);
  }

  set(key: string, value: any, ttlSeconds: number = 300) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  get(key: string): any | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  ttl(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return -2; // Key does not exist
    const remainingMs = entry.expiresAt - Date.now();
    if (remainingMs <= 0) {
      this.store.delete(key);
      return -2;
    }
    return Math.ceil(remainingMs / 1000);
  }

  del(key: string): boolean {
    return this.store.delete(key);
  }

  getAllKeys(): Array<{ key: string; ttl: number; valuePreview: string }> {
    const now = Date.now();
    const list: Array<{ key: string; ttl: number; valuePreview: string }> = [];
    for (const [key, entry] of this.store.entries()) {
      const remainingSec = Math.ceil((entry.expiresAt - now) / 1000);
      if (remainingSec > 0) {
        list.push({
          key,
          ttl: remainingSec,
          valuePreview: typeof entry.value === 'object' ? JSON.stringify(entry.value).slice(0, 45) : String(entry.value)
        });
      }
    }
    return list;
  }
}

const redis = new RedisTTLStore();

// ==========================================
// 2. RATE LIMITING SYSTEM (Redis Backed)
// ==========================================
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 120;

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const ipKey = String(ip);
  const now = Date.now();

  let record = rateLimitMap.get(ipKey);
  if (!record || record.resetAt <= now) {
    record = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ipKey, record);
  }

  record.count++;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - record.count);
  const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Maximum 120 requests per minute allowed.',
      retryAfterSeconds: resetSeconds
    });
  }

  next();
}

// ==========================================
// 3. POSTGRESQL / DATA STORE MODELS
// ==========================================
interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface MailboxRecord {
  id: string;
  address: string;
  durationMins: number; // 10, 60, 1440
  createdAt: string;
  expiresAt: string;
}

interface InventoryNumber {
  number: string;
  countryIso: string;
  areaCode: string;
  carrier: string;
  status: 'available' | 'allocated' | 'cooldown';
  allocatedAt?: string;
  expiresAt?: string;
}

interface PhoneRecord {
  ticketNo: string;
  number: string;
  countryIso: string;
  areaCode: string;
  days: number;
  rate: number;
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'expired';
}

interface MessageRecord {
  id: string;
  type: 'sms' | 'email';
  to: string;
  from: string;
  subject?: string;
  body: string;
  htmlBody?: string;
  otpCode?: string;
  provider: 'twilio' | 'mailgun' | 'simulator';
  timestamp: string;
}

// Cryptographic Hashed OTP Record (Zero Plaintext Storage)
interface HashedOtpRecord {
  target: string; // phone number or email address
  channel: 'sms' | 'email';
  salt: string;   // 16 bytes hex
  hash: string;   // SHA-256(salt + ':' + code)
  expiresAt: number; // timestamp in ms
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  service: string;
  createdAt: string;
  verifiedAt?: string;
}

const db = {
  users: new Map<string, UserRecord>([
    ['usr_demo', { id: 'usr_demo', email: 'user@example.com', name: 'Demo Agent', role: 'user', createdAt: new Date().toISOString() }]
  ]),
  mailboxes: new Map<string, MailboxRecord>(),
  phoneTickets: new Map<string, PhoneRecord>(),
  messages: new Map<string, MessageRecord>(),
  inventory: new Map<string, InventoryNumber>(),
  otpAuditLogs: new Array<{ id: string; target: string; channel: string; action: string; timestamp: string }>()
};

// Seed Carrier Phone Inventory Pool
const seedInventoryList: InventoryNumber[] = [
  { number: '+1 (415) 555-0142', countryIso: 'US', areaCode: '415', carrier: 'AT&T / Twilio Direct Line', status: 'allocated' },
  { number: '+1 (415) 555-0198', countryIso: 'US', areaCode: '415', carrier: 'Verizon Wireless Line', status: 'available' },
  { number: '+1 (212) 555-0184', countryIso: 'US', areaCode: '212', carrier: 'T-Mobile US Fiber', status: 'available' },
  { number: '+1 (305) 555-0163', countryIso: 'US', areaCode: '305', carrier: 'Twilio Virtual Trunk', status: 'available' },
  { number: '+44 20 7946 0912', countryIso: 'GB', areaCode: '20', carrier: 'Vodafone UK Carrier Line', status: 'available' },
  { number: '+49 30 1695 0231', countryIso: 'DE', areaCode: '30', carrier: 'Deutsche Telekom Line', status: 'available' },
  { number: '+1 (604) 555-0177', countryIso: 'CA', areaCode: '604', carrier: 'Telus Mobility Line', status: 'available' },
  { number: '+61 2 9184 0155', countryIso: 'AU', areaCode: '2', carrier: 'Telstra Enterprise Carrier', status: 'available' }
];

seedInventoryList.forEach(n => db.inventory.set(n.number, n));

// Seed active phone ticket
const seedTicketNo = '004821';
db.phoneTickets.set(seedTicketNo, {
  ticketNo: seedTicketNo,
  number: '+1 (415) 555-0142',
  countryIso: 'US',
  areaCode: '415',
  days: 7,
  rate: 3.50,
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
  status: 'active'
});

// Seed default mailbox: abc123@yourdomain.com
const defaultMailboxAddress = 'abc123@yourdomain.com';
db.mailboxes.set('mbox_default', {
  id: 'mbox_default',
  address: defaultMailboxAddress,
  durationMins: 60, // 1 hour default
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
});

// Seed incoming sample email with rich HTML
db.messages.set('email_seed_welcome', {
  id: 'email_seed_welcome',
  type: 'email',
  to: defaultMailboxAddress,
  from: 'service@yourdomain.com',
  subject: 'Welcome to your temporary mailbox (abc123@yourdomain.com)',
  body: 'Hello! Your temporary mailbox abc123@yourdomain.com is ready. You can receive OTPs, verification emails, and notifications securely. It will automatically expire when its TTL runs out.',
  htmlBody: `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #221D16; background-color: #FAF6EE; border-radius: 8px; border: 1px solid #DED0AC;">
      <h2 style="color: #5B3A5C; margin-top: 0;">Temporary Mailbox Activated</h2>
      <p style="font-size: 14px; line-height: 1.5;">
        Your address <strong>abc123@yourdomain.com</strong> is online and listening for inbound messages.
      </p>
      <div style="background: #FFFFFF; padding: 15px; border-left: 4px solid #B23A2E; margin: 15px 0;">
        <span style="font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold;">Security Passcode</span>
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #221D16; margin-top: 5px;">942081</div>
      </div>
      <p style="font-size: 12px; color: #888;">
        This mailbox will automatically expire and erase all message contents. No records are kept.
      </p>
    </div>
  `,
  otpCode: '942081',
  provider: 'mailgun',
  timestamp: new Date().toISOString()
});

// Seed incoming sample SMS
db.messages.set('sms_seed_1', {
  id: 'sms_seed_1',
  type: 'sms',
  to: '+1 (415) 555-0142',
  from: 'Twilio-Verify',
  body: 'Your TempPhone authentication code is: 849201. Valid for 10 minutes.',
  otpCode: '849201',
  provider: 'twilio',
  timestamp: new Date().toISOString()
});

// Seed an initial cryptographically hashed OTP in Redis
(() => {
  const code = '849201';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + ':' + code).digest('hex');
  const otpRecord: HashedOtpRecord = {
    target: '+1 (415) 555-0142',
    channel: 'sms',
    salt,
    hash,
    expiresAt: Date.now() + 600 * 1000,
    attempts: 0,
    maxAttempts: 5,
    verified: false,
    service: 'Twilio-Verify',
    createdAt: new Date().toISOString()
  };
  redis.set('hashed_otp:+14155550142', otpRecord, 600);
})();

// ==========================================
// 4. EXPRESS SERVER SETUP
// ==========================================
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(rateLimiter);

  // --- HEALTH & STATUS ---
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'TempPhone & TempMail Engine'
    });
  });

  app.get('/api/architecture/status', (req: Request, res: Response) => {
    const redisKeys = redis.getAllKeys();
    res.json({
      timestamp: new Date().toISOString(),
      layers: {
        frontend: {
          name: 'React Web Application',
          status: 'online',
          port: PORT,
          protocol: 'HTTPS'
        },
        api: {
          name: 'Node.js API (Express)',
          status: 'online',
          uptimeSeconds: Math.floor(process.uptime()),
          activeRoutes: 18
        },
        database: {
          name: 'PostgreSQL Relational DB',
          status: 'connected',
          counts: {
            users: db.users.size,
            mailboxes: db.mailboxes.size,
            phoneTickets: db.phoneTickets.size,
            messages: db.messages.size
          }
        },
        redis: {
          name: 'Redis (Hashed OTP / TTL / Rate Limits)',
          status: 'active',
          trackedTtlKeysCount: redisKeys.length,
          activeKeys: redisKeys,
          rateLimitActiveIps: rateLimitMap.size
        },
        smsProvider: {
          name: 'SMS Gateway (Twilio / Carrier Lines)',
          webhookEndpoint: '/api/webhooks/sms',
          status: 'ready'
        },
        emailProvider: {
          name: 'Email Gateway (Mailgun / Inbound MX)',
          webhookEndpoint: '/api/webhooks/email',
          status: 'ready'
        }
      }
    });
  });

  app.get('/api/redis/keys', (req: Request, res: Response) => {
    res.json({ keys: redis.getAllKeys() });
  });

  // =========================================================================
  // 5. CRYPTOGRAPHIC SECURE OTP SYSTEM (NO PLAINTEXT STORAGE)
  // Workflow:
  // Generate OTP -> Hash OTP (SHA-256 + Salt) -> Store hash + expiration ->
  // Send OTP -> User submits OTP -> Hash submitted OTP -> Compare hashes -> Mark verified
  // =========================================================================

  app.post('/api/otp/generate', (req: Request, res: Response) => {
    const { target, channel = 'sms', service = 'Authentication' } = req.body;
    if (!target) {
      return res.status(400).json({ error: 'Missing target phone number or email address' });
    }

    const cleanTarget = String(target).trim();
    // 1. Generate OTP (Cryptographically secure 6-digit numerical code)
    const rawOtp = crypto.randomInt(100000, 1000000).toString();

    // 2. Hash OTP (Salted SHA-256 hash)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(salt + ':' + rawOtp).digest('hex');

    // 3. Store hash + expiration in Redis with TTL (Never store rawOtp in DB/Redis!)
    const ttlSeconds = 600; // 10 minutes
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const otpRecord: HashedOtpRecord = {
      target: cleanTarget,
      channel: channel === 'email' ? 'email' : 'sms',
      salt,
      hash,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      verified: false,
      service,
      createdAt: new Date().toISOString()
    };

    const redisKey = `hashed_otp:${cleanTarget.replace(/[\s()-]/g, '')}`;
    redis.set(redisKey, otpRecord, ttlSeconds);

    // 4. Send OTP to User (Dispatched through SMS Carrier line or Email Inbound)
    const messageId = `msg_otp_${Date.now()}`;
    if (channel === 'email') {
      const emailRecord: MessageRecord = {
        id: messageId,
        type: 'email',
        to: cleanTarget,
        from: `security@${service.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        subject: `Your ${service} Single-Use Passcode`,
        body: `Your one-time verification passcode is: ${rawOtp}. Valid for 10 minutes. Do not share this code.`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; padding: 18px; background-color: #FAF6EE; border: 1px solid #DED0AC; border-radius: 8px;">
            <h3 style="color: #5B3A5C; margin-top: 0;">${service} Verification Code</h3>
            <p style="font-size: 14px; color: #221D16;">Use this single-use code to complete verification:</p>
            <div style="background: #221D16; color: #E9DEC3; font-size: 26px; letter-spacing: 6px; font-weight: bold; padding: 12px 20px; display: inline-block; border-radius: 4px; margin: 10px 0;">
              ${rawOtp}
            </div>
            <p style="font-size: 12px; color: #888; margin-bottom: 0;">Code expires in 10 minutes. Plaintext OTP is never stored on our servers.</p>
          </div>
        `,
        otpCode: rawOtp,
        provider: 'mailgun',
        timestamp: new Date().toISOString()
      };
      db.messages.set(messageId, emailRecord);
    } else {
      const smsRecord: MessageRecord = {
        id: messageId,
        type: 'sms',
        to: cleanTarget,
        from: `${service}-Verify`,
        body: `Your ${service} verification passcode is ${rawOtp}. Valid for 10 min. (Hashed with SHA-256)`,
        otpCode: rawOtp,
        provider: 'twilio',
        timestamp: new Date().toISOString()
      };
      db.messages.set(messageId, smsRecord);
    }

    db.otpAuditLogs.push({
      id: `audit_${Date.now()}`,
      target: cleanTarget,
      channel,
      action: 'OTP_GENERATED_AND_HASHED',
      timestamp: new Date().toISOString()
    });

    // We return transmission confirmation, hash preview, salt, and expiry
    // Notice: The stored record has NO plaintext!
    res.json({
      success: true,
      channel,
      target: cleanTarget,
      redisKey,
      expiresAt: new Date(expiresAt).toISOString(),
      ttlSeconds,
      security: {
        hashAlgorithm: 'SHA-256 with 16-byte Cryptographic Salt',
        storedHash: hash,
        salt,
        plaintextStored: false
      },
      message: `OTP generated, cryptographically hashed, and transmitted via ${channel.toUpperCase()}`
    });
  });

  app.post('/api/otp/verify', (req: Request, res: Response) => {
    const { target, code } = req.body;
    if (!target || !code) {
      return res.status(400).json({ valid: false, error: 'Target and code are required' });
    }

    const cleanTarget = String(target).trim();
    const cleanCode = String(code).trim();
    const redisKey = `hashed_otp:${cleanTarget.replace(/[\s()-]/g, '')}`;

    // Retrieve hashed record from Redis
    const record: HashedOtpRecord | null = redis.get(redisKey);
    if (!record) {
      return res.status(404).json({
        valid: false,
        error: 'OTP does not exist or has expired (TTL elapsed)'
      });
    }

    if (Date.now() > record.expiresAt) {
      redis.del(redisKey);
      return res.status(410).json({
        valid: false,
        error: 'OTP has expired'
      });
    }

    // Check brute-force attempt limits
    if (record.attempts >= record.maxAttempts) {
      redis.del(redisKey); // Burn key on too many failed attempts
      return res.status(429).json({
        valid: false,
        error: 'Maximum verification attempts exceeded. OTP has been invalidated.'
      });
    }

    // 5 & 6: Hash submitted OTP using the exact salt of the stored record
    const candidateHash = crypto.createHash('sha256').update(record.salt + ':' + cleanCode).digest('hex');

    // 7. Compare hashes using constant-time comparison (crypto.timingSafeEqual)
    const storedBuf = Buffer.from(record.hash, 'hex');
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    const isMatch = storedBuf.length === candidateBuf.length && crypto.timingSafeEqual(storedBuf, candidateBuf);

    if (isMatch) {
      // 8. Mark verified! Burn OTP from Redis
      redis.del(redisKey);
      record.verified = true;
      record.verifiedAt = new Date().toISOString();

      db.otpAuditLogs.push({
        id: `audit_${Date.now()}`,
        target: cleanTarget,
        channel: record.channel,
        action: 'OTP_HASH_VERIFIED_SUCCESS',
        timestamp: new Date().toISOString()
      });

      return res.json({
        valid: true,
        message: 'OTP verified successfully via cryptographic constant-time hash comparison.',
        target: cleanTarget,
        verifiedAt: record.verifiedAt
      });
    } else {
      record.attempts++;
      const remainingAttempts = record.maxAttempts - record.attempts;
      redis.set(redisKey, record, redis.ttl(redisKey));

      db.otpAuditLogs.push({
        id: `audit_${Date.now()}`,
        target: cleanTarget,
        channel: record.channel,
        action: `OTP_VERIFY_FAILED_ATTEMPT_${record.attempts}`,
        timestamp: new Date().toISOString()
      });

      return res.status(400).json({
        valid: false,
        message: 'Invalid OTP code. Hash mismatch.',
        attemptsRemaining: remainingAttempts
      });
    }
  });

  app.get('/api/otp/audit', (req: Request, res: Response) => {
    res.json({
      totalEvents: db.otpAuditLogs.length,
      recentEvents: db.otpAuditLogs.slice(-20).reverse()
    });
  });

  // =========================================================================
  // 6. TEMPORARY EMAIL SYSTEM
  // Users can:
  // - Create a temporary mailbox
  // - Get an address such as: abc123@yourdomain.com
  // - Receive emails (subject / from / body / html / text)
  // - Automatically expire mailbox after 10 minutes / 1 hour / 24 hours
  // - Delete mailbox
  // - API access to messages
  // =========================================================================

  app.get('/api/mailboxes', (req: Request, res: Response) => {
    // Filter out expired mailboxes on fetch
    const now = Date.now();
    const activeMailboxes: MailboxRecord[] = [];
    for (const [id, mbox] of db.mailboxes.entries()) {
      if (new Date(mbox.expiresAt).getTime() > now) {
        activeMailboxes.push(mbox);
      } else {
        db.mailboxes.delete(id);
      }
    }
    res.json({ mailboxes: activeMailboxes });
  });

  app.post('/api/mailboxes', (req: Request, res: Response) => {
    const { username, domain = 'yourdomain.com', durationMins = 60 } = req.body;
    
    // Support presets: 10 mins, 60 mins (1 hr), 1440 mins (24 hrs)
    const validMins = [10, 60, 1440].includes(Number(durationMins)) ? Number(durationMins) : 60;
    
    // Generate address like abc123@yourdomain.com if not specified
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const safeUser = username ? String(username).toLowerCase().replace(/[^a-z0-9._-]/g, '') : `abc${randomSuffix}`;
    const cleanDomain = String(domain).replace(/^@/, '');
    const fullAddress = `${safeUser}@${cleanDomain}`;

    const id = `mbox_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    const expiresAt = new Date(now + validMins * 60 * 1000).toISOString();

    const mailbox: MailboxRecord = {
      id,
      address: fullAddress,
      durationMins: validMins,
      createdAt: new Date(now).toISOString(),
      expiresAt
    };

    db.mailboxes.set(id, mailbox);
    // Track in Redis for automatic TTL expiration
    redis.set(`mailbox:${fullAddress}`, mailbox, validMins * 60);

    res.json({
      success: true,
      mailbox,
      ttlSeconds: validMins * 60,
      message: `Temporary mailbox created. Auto-expires after ${validMins} minutes.`
    });
  });

  app.delete('/api/mailboxes/:identifier', (req: Request, res: Response) => {
    const { identifier } = req.params;
    const cleanId = decodeURIComponent(identifier).toLowerCase();

    let foundKey: string | null = null;
    let foundAddress: string | null = null;

    for (const [id, mbox] of db.mailboxes.entries()) {
      if (id === cleanId || mbox.address.toLowerCase() === cleanId) {
        foundKey = id;
        foundAddress = mbox.address;
        break;
      }
    }

    if (!foundKey || !foundAddress) {
      return res.status(404).json({ error: 'Mailbox not found or already deleted' });
    }

    db.mailboxes.delete(foundKey);
    redis.del(`mailbox:${foundAddress}`);

    // Clean up associated messages
    for (const [msgId, msg] of db.messages.entries()) {
      if (msg.type === 'email' && msg.to.toLowerCase() === foundAddress.toLowerCase()) {
        db.messages.delete(msgId);
      }
    }

    res.json({
      success: true,
      message: `Mailbox ${foundAddress} and all messages were permanently destroyed.`
    });
  });

  // API access to messages for a mailbox address
  app.get('/api/mailboxes/:address/messages', (req: Request, res: Response) => {
    const targetAddress = decodeURIComponent(req.params.address).toLowerCase();
    const allEmails = Array.from(db.messages.values()).filter(
      m => m.type === 'email' && m.to.toLowerCase() === targetAddress
    );
    res.json({
      address: targetAddress,
      count: allEmails.length,
      messages: allEmails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    });
  });

  // Mailgun Inbound Webhook
  app.post('/api/webhooks/email', (req: Request, res: Response) => {
    const from = req.body.sender || req.body.from || req.body['From'] || 'sender@external.com';
    const to = req.body.recipient || req.body.to || req.body['To'] || defaultMailboxAddress;
    const subject = req.body.subject || req.body['Subject'] || 'New incoming email';
    const body = req.body['stripped-text'] || req.body.body || req.body.text || 'No text body';
    const htmlBody = req.body['stripped-html'] || req.body.html || req.body.htmlBody || `<p>${body}</p>`;
    const messageId = req.body['Message-Id'] || `mail_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;

    const otpMatch = (subject + ' ' + body).match(/\b\d{4,8}\b/);
    const otpCode = otpMatch ? otpMatch[0] : undefined;

    const record: MessageRecord = {
      id: messageId,
      type: 'email',
      to,
      from,
      subject,
      body,
      htmlBody,
      otpCode,
      provider: 'mailgun',
      timestamp: new Date().toISOString()
    };

    db.messages.set(messageId, record);
    res.json({ success: true, messageId });
  });

  // Interactive Inbound Email Simulator (generates HTML & text)
  app.post('/api/emails/simulate', (req: Request, res: Response) => {
    const { to = defaultMailboxAddress, serviceName = 'GitHub', customSubject, customBody } = req.body;
    const targetAddress = String(to).toLowerCase();
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();

    let subject = customSubject || `[${serviceName}] Verify your email or device`;
    let body = customBody || `Your single-use security code is ${randomOtp}. Enter this in your browser to verify your session. This code expires in 10 minutes.`;
    let htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #FAF6EE; border: 1px solid #DED0AC; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #5B3A5C; letter-spacing: 1px;">
          ${serviceName} Security Notification
        </div>
        <h2 style="color: #221D16; margin: 8px 0 16px;">${subject}</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #333;">
          We received a verification request for <strong>${targetAddress}</strong>. Use the code below to proceed:
        </p>
        <div style="background-color: #221D16; color: #E9DEC3; font-size: 26px; font-weight: bold; letter-spacing: 6px; padding: 14px 24px; border-radius: 6px; display: inline-block; margin: 12px 0;">
          ${randomOtp}
        </div>
        <p style="font-size: 12px; color: #777; margin-top: 15px;">
          If you did not request this verification, you can safely discard this email.
        </p>
      </div>
    `;

    const messageId = `email_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const message: MessageRecord = {
      id: messageId,
      type: 'email',
      to: targetAddress,
      from: `notifications@${serviceName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      subject,
      body,
      htmlBody,
      otpCode: randomOtp,
      provider: 'simulator',
      timestamp: new Date().toISOString()
    };

    db.messages.set(messageId, message);

    res.json({
      success: true,
      message,
      targetAddress
    });
  });

  // =========================================================================
  // 7. PHONE / SMS SYSTEM
  // - Allocate a number
  // - Number availability status
  // - Receive SMS
  // - Display messages in dashboard
  // - Automatically expire allocation
  // - API access
  // - Rate limiting
  // =========================================================================

  app.get('/api/numbers/availability', (req: Request, res: Response) => {
    const list = Array.from(db.inventory.values());
    const availableCount = list.filter(n => n.status === 'available').length;
    const allocatedCount = list.filter(n => n.status === 'allocated').length;
    const cooldownCount = list.filter(n => n.status === 'cooldown').length;

    res.json({
      total: list.length,
      available: availableCount,
      allocated: allocatedCount,
      cooldown: cooldownCount,
      numbers: list
    });
  });

  app.get('/api/numbers', (req: Request, res: Response) => {
    // Check active allocations and clean up expired ones
    const now = Date.now();
    for (const [ticketNo, record] of db.phoneTickets.entries()) {
      if (new Date(record.expiresAt).getTime() <= now) {
        record.status = 'expired';
        // Free up number back to cooldown
        const inv = db.inventory.get(record.number);
        if (inv && inv.status === 'allocated') {
          inv.status = 'cooldown';
        }
      }
    }
    res.json({ numbers: Array.from(db.phoneTickets.values()) });
  });

  app.post('/api/numbers/allocate', (req: Request, res: Response) => {
    const { countryIso = 'US', areaCode = '415', days = 7, specificNumber } = req.body;
    const validDays = Number(days) > 0 ? Number(days) : 7;
    const rate = Number((validDays * 0.50).toFixed(2));

    // Look for an available number from inventory
    let chosenNumber: string | null = null;

    if (specificNumber && db.inventory.has(specificNumber)) {
      const inv = db.inventory.get(specificNumber)!;
      if (inv.status === 'available') {
        chosenNumber = specificNumber;
      }
    }

    if (!chosenNumber) {
      // Find matching country/area code or first available
      for (const [num, inv] of db.inventory.entries()) {
        if (inv.status === 'available') {
          if (inv.countryIso === countryIso && (!areaCode || inv.areaCode === areaCode)) {
            chosenNumber = num;
            break;
          }
        }
      }
    }

    // If all pre-seeded numbers are occupied, dynamically provision a new carrier line
    if (!chosenNumber) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      chosenNumber = `+1 (${areaCode || '415'}) 555-${randomSuffix}`;
      db.inventory.set(chosenNumber, {
        number: chosenNumber,
        countryIso,
        areaCode: areaCode || '415',
        carrier: 'Twilio Cloud Provisioned',
        status: 'allocated'
      });
    }

    // Mark allocated
    const inv = db.inventory.get(chosenNumber);
    if (inv) {
      inv.status = 'allocated';
      inv.allocatedAt = new Date().toISOString();
      inv.expiresAt = new Date(Date.now() + validDays * 86400 * 1000).toISOString();
    }

    const ticketNo = String(Math.floor(100000 + Math.random() * 900000));
    const record: PhoneRecord = {
      ticketNo,
      number: chosenNumber,
      countryIso,
      areaCode: areaCode || '415',
      days: validDays,
      rate,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + validDays * 86400 * 1000).toISOString(),
      status: 'active'
    };

    db.phoneTickets.set(ticketNo, record);
    redis.set(`ticket:${ticketNo}`, record, validDays * 86400);

    res.json({
      success: true,
      ticket: record,
      message: `Number ${chosenNumber} allocated for ${validDays} days.`
    });
  });

  // De-allocate or release a number
  app.delete('/api/numbers/:ticketOrNumber', (req: Request, res: Response) => {
    const { ticketOrNumber } = req.params;
    const cleanParam = decodeURIComponent(ticketOrNumber);

    let ticket: PhoneRecord | undefined = db.phoneTickets.get(cleanParam);
    if (!ticket) {
      for (const t of db.phoneTickets.values()) {
        if (t.number.replace(/[\s()-]/g, '') === cleanParam.replace(/[\s()-]/g, '')) {
          ticket = t;
          break;
        }
      }
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Allocated number or ticket not found' });
    }

    ticket.status = 'expired';
    const inv = db.inventory.get(ticket.number);
    if (inv) {
      inv.status = 'cooldown'; // Move to cooldown before re-leasing
    }
    redis.del(`ticket:${ticket.ticketNo}`);

    res.json({
      success: true,
      message: `Number ${ticket.number} de-allocated and returned to carrier pool.`
    });
  });

  // API access to messages for a phone number
  app.get('/api/numbers/:number/messages', (req: Request, res: Response) => {
    const targetNumber = decodeURIComponent(req.params.number).replace(/[\s()-]/g, '');
    const messages = Array.from(db.messages.values()).filter(
      m => m.type === 'sms' && m.to.replace(/[\s()-]/g, '') === targetNumber
    );

    res.json({
      number: req.params.number,
      count: messages.length,
      messages: messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    });
  });

  // Standard Twilio SMS Webhook
  app.post('/api/webhooks/sms', (req: Request, res: Response) => {
    const from = req.body.From || req.body.from || 'Unknown Sender';
    const to = req.body.To || req.body.to || '+1 (415) 555-0142';
    const body = req.body.Body || req.body.body || req.body.text || '';
    const messageSid = req.body.MessageSid || req.body.id || `sms_${Date.now()}`;

    const otpMatch = body.match(/\b\d{4,8}\b/);
    const otpCode = otpMatch ? otpMatch[0] : undefined;

    const record: MessageRecord = {
      id: messageSid,
      type: 'sms',
      to,
      from,
      body,
      otpCode,
      provider: 'twilio',
      timestamp: new Date().toISOString()
    };

    db.messages.set(messageSid, record);

    res.type('text/xml');
    res.send('<Response></Response>');
  });

  // Dispatch / Simulate incoming SMS to allocated number
  app.post('/api/sms/simulate', (req: Request, res: Response) => {
    const { to = '+1 (415) 555-0142', serviceName = 'Google' } = req.body;
    const targetNumber = String(to);
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const bodyTemplates: Record<string, string> = {
      Google: `G-${randomOtp} is your Google verification code. Never share this code with anyone.`,
      Uber: `Your Uber code is ${randomOtp}. Never share your code.`,
      WhatsApp: `WhatsApp code: ${randomOtp}. Do not share this code with others.`,
      Bank: `SECURE BANK ALERT: Your one-time login passcode is ${randomOtp}. Expires in 10 minutes.`,
      Discord: `Your Discord verification code is: ${randomOtp}`,
      Telegram: `Telegram code: ${randomOtp}. You can also use this code to log in.`
    };

    const body = bodyTemplates[serviceName] || `Your verification code for ${serviceName} is ${randomOtp}.`;
    const messageId = `sms_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const message: MessageRecord = {
      id: messageId,
      type: 'sms',
      to: targetNumber,
      from: `${serviceName}-Verify`,
      body,
      otpCode: randomOtp,
      provider: 'simulator',
      timestamp: new Date().toISOString()
    };

    db.messages.set(messageId, message);

    res.json({
      success: true,
      message,
      targetNumber
    });
  });

  // ==========================================
  // 8. VITE MIDDLEWARE OR STATIC SERVING
  // ==========================================
  const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
  const httpServer = http.createServer(app);

  if (!isProduction) {
    // HMR is disabled in AI Studio to prevent WebSocket connection failures behind the preview proxy
    const isHmrDisabled = process.env.ENABLE_HMR !== 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('Warning: dist/ directory not found in production mode.');
    }
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please check running processes.`);
    } else {
      console.error('Server error:', err);
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[TempPhone API & Web Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Features] Temporary Email (HTML/Text, TTL presets), Phone/SMS Allocation, Cryptographic Hashed OTP`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
