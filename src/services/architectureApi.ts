export interface ArchitectureLayerStatus {
  frontend: {
    name: string;
    status: 'online' | 'degraded' | 'offline';
    port: number;
    protocol: string;
  };
  api: {
    name: string;
    status: 'online' | 'degraded' | 'offline';
    uptimeSeconds: number;
    activeRoutes: number;
  };
  database: {
    name: string;
    status: 'connected' | 'error';
    counts: {
      users: number;
      mailboxes: number;
      phoneTickets: number;
      messages: number;
    };
  };
  redis: {
    name: string;
    status: 'active' | 'degraded';
    trackedTtlKeysCount: number;
    activeKeys: Array<{ key: string; ttl: number; valuePreview: string }>;
    rateLimitActiveIps: number;
  };
  smsProvider: {
    name: string;
    webhookEndpoint: string;
    status: 'ready' | 'offline';
  };
  emailProvider: {
    name: string;
    webhookEndpoint: string;
    status: 'ready' | 'offline';
  };
}

export interface ArchitectureResponse {
  timestamp: string;
  layers: ArchitectureLayerStatus;
}

export interface InventoryNumber {
  number: string;
  countryIso: string;
  areaCode: string;
  carrier: string;
  status: 'available' | 'allocated' | 'cooldown';
  allocatedAt?: string;
  expiresAt?: string;
}

export interface NumberAvailabilityResponse {
  total: number;
  available: number;
  allocated: number;
  cooldown: number;
  numbers: InventoryNumber[];
}

export interface HashedOtpGenerateResponse {
  success: boolean;
  channel: 'sms' | 'email';
  target: string;
  redisKey: string;
  expiresAt: string;
  ttlSeconds: number;
  security: {
    hashAlgorithm: string;
    storedHash: string;
    salt: string;
    plaintextStored: boolean;
  };
  message: string;
}

export interface HashedOtpVerifyResponse {
  valid: boolean;
  message: string;
  target?: string;
  verifiedAt?: string;
  attemptsRemaining?: number;
  error?: string;
}

// ----------------------------------------------------
// Health & Architecture Layer
// ----------------------------------------------------
export async function getArchitectureStatus(): Promise<ArchitectureResponse | null> {
  try {
    const res = await fetch('/api/architecture/status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to query architecture status:', err);
    return null;
  }
}

export async function getRedisKeys(): Promise<Array<{ key: string; ttl: number; valuePreview: string }>> {
  try {
    const res = await fetch('/api/redis/keys');
    if (!res.ok) return [];
    const data = await res.json();
    return data.keys || [];
  } catch (err) {
    return [];
  }
}

// ----------------------------------------------------
// Cryptographic Hashed OTP System
// ----------------------------------------------------
export async function generateCryptographicOtp(
  target: string,
  channel: 'sms' | 'email' = 'sms',
  service: string = 'Authentication'
): Promise<HashedOtpGenerateResponse | null> {
  try {
    const res = await fetch('/api/otp/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, channel, service })
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to generate hashed OTP:', err);
    return null;
  }
}

export async function verifyCryptographicOtp(
  target: string,
  code: string
): Promise<HashedOtpVerifyResponse> {
  try {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, code })
    });
    return await res.json();
  } catch (err) {
    return { valid: false, message: 'Network error connecting to OTP server', error: 'Network error connecting to OTP server' };
  }
}

export async function getOtpAuditLogs(): Promise<{ totalEvents: number; recentEvents: any[] }> {
  try {
    const res = await fetch('/api/otp/audit');
    if (!res.ok) return { totalEvents: 0, recentEvents: [] };
    return await res.json();
  } catch (err) {
    return { totalEvents: 0, recentEvents: [] };
  }
}

// ----------------------------------------------------
// Temporary Mailboxes (API Access, HTML, TTL Presets)
// ----------------------------------------------------
export async function createTemporaryMailbox(
  username?: string,
  domain: string = 'yourdomain.com',
  durationMins: number = 60
) {
  try {
    const res = await fetch('/api/mailboxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, domain, durationMins })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function deleteTemporaryMailbox(identifier: string) {
  try {
    const res = await fetch(`/api/mailboxes/${encodeURIComponent(identifier)}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getMailboxMessages(address: string) {
  try {
    const res = await fetch(`/api/mailboxes/${encodeURIComponent(address)}/messages`);
    if (!res.ok) return { address, count: 0, messages: [] };
    return await res.json();
  } catch (err) {
    return { address, count: 0, messages: [] };
  }
}

export async function simulateInboundEmail(
  to: string,
  serviceName: string = 'GitHub',
  customSubject?: string,
  customBody?: string
) {
  try {
    const res = await fetch('/api/emails/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, serviceName, customSubject, customBody })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ----------------------------------------------------
// Phone / SMS Allocation & Messages
// ----------------------------------------------------
export async function getNumberAvailability(): Promise<NumberAvailabilityResponse | null> {
  try {
    const res = await fetch('/api/numbers/availability');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function allocatePhoneNumber(
  countryIso: string = 'US',
  areaCode: string = '415',
  days: number = 7,
  specificNumber?: string
) {
  try {
    const res = await fetch('/api/numbers/allocate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryIso, areaCode, days, specificNumber })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function releasePhoneNumber(ticketOrNumber: string) {
  try {
    const res = await fetch(`/api/numbers/${encodeURIComponent(ticketOrNumber)}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getNumberMessages(number: string) {
  try {
    const res = await fetch(`/api/numbers/${encodeURIComponent(number)}/messages`);
    if (!res.ok) return { number, count: 0, messages: [] };
    return await res.json();
  } catch (err) {
    return { number, count: 0, messages: [] };
  }
}

export async function simulateInboundSms(to: string, serviceName: string = 'Google') {
  try {
    const res = await fetch('/api/sms/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, serviceName })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ----------------------------------------------------
// Webhook & Verification Aliases for Architecture Modal
// ----------------------------------------------------
export async function triggerTwilioSmsWebhook(to: string, serviceName: string = 'Google') {
  return await simulateInboundSms(to, serviceName);
}

export async function triggerMailgunEmailWebhook(to: string, serviceName: string = 'GitHub') {
  return await simulateInboundEmail(to, serviceName);
}

export async function verifyRedisOtp(redisKeyOrTarget: string, code: string) {
  // If a full redis key was provided like "otp:hash:+123...", extract target or pass as is
  const cleanedTarget = redisKeyOrTarget.startsWith('otp:hash:')
    ? redisKeyOrTarget.replace('otp:hash:', '')
    : redisKeyOrTarget;
  return await verifyCryptographicOtp(cleanedTarget, code);
}

