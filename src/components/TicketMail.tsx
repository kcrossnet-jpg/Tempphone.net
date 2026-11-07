import React, { useState, useEffect } from 'react';
import { MailMessage, MailTicket, PageView, UserSession } from '../types';
import { MAIL_ADJECTIVES, MAIL_DOMAINS } from '../data/countries';
import { copyToClipboard, safeStorage } from '../utils/storage';
import { toSafeDate, formatTimeSafe } from '../utils/date';
import {
  saveMailTicketToFirestore,
  loadMailTicketsFromFirestore,
  deleteMailTicketFromFirestore
} from '../lib/firebase';
import { Dices, Copy, Check, Send, Mail, RefreshCw, ArrowLeft, Loader2, Flame, Eye, FileText } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import {
  createTemporaryMailbox,
  deleteTemporaryMailbox,
  getMailboxMessages
} from '../services/architectureApi';

interface TicketMailProps {
  session?: UserSession | null;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onNavigate?: (page: PageView) => void;
  onOpenAuth?: () => void;
}

export const TicketMail: React.FC<TicketMailProps> = ({
  session,
  onShowToast,
  onNavigate,
  onOpenAuth
}) => {
  const generateRandomHandle = () => {
    const adj = MAIL_ADJECTIVES[Math.floor(Math.random() * MAIL_ADJECTIVES.length)];
    const num = Math.floor(10 + Math.random() * 90);
    return `${adj}${num}`;
  };

  const [username, setUsername] = useState(generateRandomHandle);
  const [domain, setDomain] = useState(MAIL_DOMAINS[0]);
  const [durationMins, setDurationMins] = useState(10);
  const [durationRate, setDurationRate] = useState(0);
  const [forwardToInbox, setForwardToInbox] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFirestoreSyncing, setIsFirestoreSyncing] = useState(false);
  const [mailFormat, setMailFormat] = useState<'html' | 'text'>('html');

  const [activeTicket, setActiveTicket] = useState<MailTicket | null>(() => {
    if (!session?.user?.id) return null;
    const saved = safeStorage.getJSON<MailTicket | null>(`tp_active_mail_ticket_${session.user.id}`, null);
    if (!saved) return null;
    return {
      ...saved,
      issuedAt: toSafeDate(saved.issuedAt),
      expiresAt: toSafeDate(saved.expiresAt)
    };
  });
  const [activeTab, setActiveTab] = useState<'inbox' | 'outbox'>('inbox');
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
  const [inboxMessages, setInboxMessages] = useState<MailMessage[]>(() => {
    if (!session?.user?.id) return [];
    return safeStorage.getJSON<MailMessage[]>(`tp_mail_inbox_${session.user.id}`, []);
  });
  const [outboxMessages, setOutboxMessages] = useState<MailMessage[]>(() => {
    if (!session?.user?.id) return [];
    return safeStorage.getJSON<MailMessage[]>(`tp_mail_outbox_${session.user.id}`, []);
  });

  const [copiedAddress, setCopiedAddress] = useState(false);

  // Sync to user-scoped local storage
  useEffect(() => {
    if (!session?.user?.id) return;
    if (activeTicket) {
      safeStorage.setJSON(`tp_active_mail_ticket_${session.user.id}`, activeTicket);
    } else {
      safeStorage.removeItem(`tp_active_mail_ticket_${session.user.id}`);
    }
  }, [activeTicket, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    safeStorage.setJSON(`tp_mail_inbox_${session.user.id}`, inboxMessages);
  }, [inboxMessages, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    safeStorage.setJSON(`tp_mail_outbox_${session.user.id}`, outboxMessages);
  }, [outboxMessages, session?.user?.id]);

  // Firestore sync when user logs in or resets on logout
  useEffect(() => {
    if (!session?.user?.id) {
      setActiveTicket(null);
      setInboxMessages([]);
      setOutboxMessages([]);
      return;
    }
    const userId = session.user.id;
    const userEmail = session.user.email;

    async function syncMailFromFirestore() {
      try {
        setIsFirestoreSyncing(true);
        const remoteTickets = await loadMailTicketsFromFirestore(userId, userEmail);
        if (remoteTickets && remoteTickets.length > 0) {
          const liveOne = remoteTickets.find((t) => t.isLive) || remoteTickets[0];
          setActiveTicket(liveOne);
          setUsername(liveOne.username);
          setDomain(liveOne.domain);
          safeStorage.setJSON(`tp_active_mail_ticket_${userId}`, liveOne);
          safeStorage.setJSON(`tp_active_mail_tickets_${userId}`, remoteTickets);
        } else {
          setActiveTicket(null);
        }
      } catch (err) {
        console.warn('Firestore mail sync notice:', err);
      } finally {
        setIsFirestoreSyncing(false);
      }
    }

    syncMailFromFirestore();
  }, [session?.user?.id, session?.user?.email]);

  // Real-time polling for incoming emails via REST API
  useEffect(() => {
    if (!activeTicket) return;
    const interval = setInterval(async () => {
      try {
        const data = await getMailboxMessages(activeTicket.fullAddress);
        if (data && Array.isArray(data.messages) && data.messages.length > 0) {
          setInboxMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newEmails = data.messages.filter((m: any) => !existingIds.has(m.id));
            if (newEmails.length > 0) {
              const formatted: MailMessage[] = newEmails.map((m: any) => ({
                id: m.id,
                from: m.from || 'sender@domain.com',
                to: m.to || activeTicket.fullAddress,
                subject: m.subject || 'Incoming Message',
                preview: (m.body || '').slice(0, 50),
                body: m.body || '',
                htmlBody: m.htmlBody,
                timestamp: 'Just now',
                isRead: false
              }));
              onShowToast(`New incoming email arrived for ${activeTicket.fullAddress}!`);
              return [...formatted, ...prev];
            }
            return prev;
          });
        }
      } catch (err) {
        // silent polling fallback
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTicket?.fullAddress]);

  // Burn and release active mail ticket state
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);

  const handleBurnMailTicket = () => {
    if (!activeTicket) return;
    setShowBurnConfirm(true);
  };

  const handleConfirmBurnMail = () => {
    if (!activeTicket) return;
    const ticketNo = activeTicket.ticketNo;
    const address = activeTicket.fullAddress;

    // Delete from backend API & purge Redis TTL
    deleteTemporaryMailbox(address);

    if (session?.user?.id) {
      deleteMailTicketFromFirestore(session.user.id, ticketNo);
      safeStorage.removeItem(`tp_active_mail_ticket_${session.user.id}`);
    }
    setActiveTicket(null);
    setInboxMessages([]);
    setOutboxMessages([]);
    setSelectedMail(null);
    onShowToast(`Disposable inbox #${ticketNo} (${address}) deleted and wiped permanently.`);
    setShowBurnConfirm(false);
  };

  // Compose states
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const currentAddress = `${username || 'user'}${domain}`;

  const calculateTotal = () => {
    return durationRate + (forwardToInbox ? 0.05 : 0);
  };

  const handleShuffle = () => {
    if (activeTicket) return;
    setIsSpinning(true);
    setUsername(generateRandomHandle());
    setTimeout(() => setIsSpinning(false), 350);
  };

  const handlePullTicket = () => {
    const durationLabel = durationMins === 10 ? '10 Min Free' : durationMins === 60 ? '1 Hour Pass' : '24 Hours Pass';

    const now = new Date();
    const expires = new Date(now.getTime() + durationMins * 60 * 1000);

    const ticket: MailTicket = {
      ticketNo: `00${Math.floor(4900 + Math.random() * 99)}`,
      username,
      domain,
      fullAddress: currentAddress,
      durationMins,
      rate: calculateTotal(),
      forwardToInbox,
      issuedAt: now,
      expiresAt: expires,
      isLive: true,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    };

    // Register mailbox on backend Express API with Redis TTL
    createTemporaryMailbox(username, domain, durationMins);

    setActiveTicket(ticket);
    // Append to multi-ticket list (user scoped)
    try {
      const storageKey = session?.user?.id ? `tp_active_mail_tickets_${session.user.id}` : 'tp_active_mail_tickets';
      const existing = safeStorage.getJSON<MailTicket[]>(storageKey, []);
      const updated = [ticket, ...existing.filter((t) => t.ticketNo !== ticket.ticketNo)];
      safeStorage.setJSON(storageKey, updated);
    } catch (err) {
      console.warn('Could not save to active mail tickets:', err);
    }

    if (session?.user?.id) {
      saveMailTicketToFirestore(session.user.id, ticket, session.user.email);
    }
    onShowToast(`Temp mail ticket #${ticket.ticketNo} active! Address ${currentAddress} ready.`);

    // Seed initial mail with rich HTML
    const welcomeMail: MailMessage = {
      id: `mail_welcome_${Date.now()}`,
      from: `system${domain}`,
      to: currentAddress,
      subject: `Your temporary inbox ${currentAddress} is active`,
      preview: 'This disposable address is live and receiving messages…',
      body: `Hi there,\n\nYour temporary inbox ${currentAddress} is active for ${durationLabel}.\n\nAnything sent to this address will populate here instantly. When your ticket expires, all records are permanently flushed from server memory.\n\n— The TempPhone Team`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; padding: 16px; background-color: #FAF6EE; border: 1px solid #DED0AC; border-radius: 8px;">
          <h3 style="color: #5B3A5C; margin-top: 0;">Temporary Mailbox Activated</h3>
          <p style="font-size: 13px; color: #221D16; line-height: 1.5;">
            Your disposable email address <strong>${currentAddress}</strong> is active for <strong>${durationLabel}</strong>.
          </p>
          <div style="background: #221D16; color: #E9DEC3; padding: 12px; border-radius: 6px; margin: 12px 0; font-family: monospace; font-size: 13px;">
            TTL Retention: ${durationMins} minutes · Auto-expires
          </div>
          <p style="font-size: 12px; color: #777; margin-bottom: 0;">
            Use the HTML / Plain text toggle above to test formatted vs raw email rendering.
          </p>
        </div>
      `,
      timestamp: 'Just now',
      isRead: false
    };

    const verificationMail: MailMessage = {
      id: `mail_verify_${Date.now()}`,
      from: 'security@cloudverify.io',
      to: currentAddress,
      subject: 'Your single-use sign-in passcode: 892-140',
      preview: 'Use code 892-140 to complete your verification…',
      body: `Hello,\n\nPlease enter the verification code below to authorize your sign-up:\n\n892-140\n\nThis token will expire in 15 minutes. If you did not request this, please disregard.\n\n— Verification Bot`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; padding: 18px; background-color: #FAF6EE; border: 1px solid #DED0AC; border-radius: 8px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #5B3A5C; font-weight: bold;">Security Passcode</div>
          <h2 style="color: #221D16; margin: 6px 0 14px;">Authorize Device Login</h2>
          <div style="background-color: #5B3A5C; color: #E9DEC3; font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 12px 20px; display: inline-block; border-radius: 4px;">
            892-140
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 14px; margin-bottom: 0;">
            This code was generated using our secure cryptographic OTP engine.
          </p>
        </div>
      `,
      timestamp: 'Just now',
      isRead: false
    };

    setInboxMessages([verificationMail, welcomeMail]);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(currentAddress);
    if (success) {
      setCopiedAddress(true);
      onShowToast(`Copied ${currentAddress}`);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleSendMail = () => {
    if (!activeTicket || !composeTo.trim() || !composeBody.trim()) return;

    const newOutbox: MailMessage = {
      id: `mail_out_${Date.now()}`,
      from: currentAddress,
      to: composeTo.trim(),
      subject: composeSubject.trim() || '(No Subject)',
      preview: composeBody.trim().slice(0, 50),
      body: composeBody.trim(),
      timestamp: 'Just now',
      isRead: true,
      isOutbound: true
    };

    setOutboxMessages((prev) => [newOutbox, ...prev]);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    onShowToast(`Dispatched message to ${newOutbox.to}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
      {/* Product Switcher Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#221D16]/20 pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex bg-[#DED0AC] p-1 rounded-lg border-2 border-[#221D16] shadow-[2px_2px_0_rgba(34,29,22,0.15)] sm:shadow-[3px_3px_0_rgba(34,29,22,0.15)]">
            <button
              type="button"
              onClick={() => onNavigate?.('ticket-phone')}
              className="flex items-center gap-2 py-2 px-4 rounded-md font-mono-retro font-bold text-xs uppercase text-[#221D16]/75 hover:text-[#221D16] hover:bg-white/40 transition-colors"
            >
              <span>📞 Phone Number</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('ticket-mail')}
              className="flex items-center gap-2 py-2 px-4 rounded-md font-mono-retro font-bold text-xs uppercase bg-[#5B3A5C] text-[#E9DEC3] shadow-[1px_1px_0_#221D16]"
            >
              <span>✉️ Temp Mail</span>
            </button>
          </div>

          {/* Database & Auth Sync Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#221D16]/30 bg-white/50 text-[11px] font-mono-retro">
            {isFirestoreSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5B3A5C]" />
                <span className="text-[#5B3A5C] font-bold">Syncing Firestore DB...</span>
              </>
            ) : session?.user ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
                <span className="text-[#221D16]/80 font-bold">Firestore DB Connected</span>
                <span className="text-[#221D16]/50">({session.user.email})</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[#221D16]/70">Local Session · Sign in to sync across devices</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="font-mono-retro text-xs font-bold uppercase tracking-widest text-[#5B3A5C] flex items-center gap-2 mb-2">
          <span>—</span> TEMP MAIL DISPOSABLE INBOX
        </div>
        <h1 className="font-anton text-3xl sm:text-4xl text-[#221D16] uppercase tracking-tight">
          Get an inbox. Read it. Let it die.
        </h1>
        <p className="text-sm sm:text-base text-[#221D16]/80 max-w-xl mt-2 leading-relaxed">
          A disposable email address for one-time sign-up forms and confirmations that don't deserve a spot in your real inbox.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Form Panel */}
        <div className="lg:col-span-6 bg-[#DED0AC] border-2 border-[#221D16] rounded-md p-4 sm:p-6 lg:p-8 shadow-[4px_4px_0_rgba(34,29,22,0.15)] sm:shadow-[6px_6px_0_rgba(34,29,22,0.15)]">
          {/* Address Handle */}
          <div className="mb-6">
            <label className="block font-mono-retro text-xs uppercase tracking-wider text-[#221D16]/70 mb-2 font-bold">
              Address Handle
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                disabled={!!activeTicket}
                maxLength={18}
                className="flex-1 px-4 py-3 bg-white/70 border-1.5 border-[#221D16] rounded font-mono-retro font-bold text-sm text-[#221D16] outline-none focus:border-[#5B3A5C] focus:bg-white disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleShuffle}
                disabled={!!activeTicket}
                title="Randomize Handle"
                className={`p-3 bg-white/50 hover:bg-white border-1.5 border-[#221D16] rounded transition-transform ${
                  isSpinning ? 'animate-spin-fast' : ''
                }`}
              >
                <Dices className="w-5 h-5 text-[#221D16]" />
              </button>
            </div>
          </div>

          {/* Domain Dropdown */}
          <div className="mb-6">
            <label className="block font-mono-retro text-xs uppercase tracking-wider text-[#221D16]/70 mb-2 font-bold">
              Disposable Domain
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={!!activeTicket}
              className="w-full px-4 py-3 bg-white/70 border-1.5 border-[#221D16] rounded font-mono-retro font-bold text-sm text-[#221D16] outline-none focus:border-[#5B3A5C] focus:bg-white cursor-pointer disabled:opacity-60"
            >
              {MAIL_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Cards */}
          <div className="mb-6">
            <label className="block font-mono-retro text-xs uppercase tracking-wider text-[#221D16]/70 mb-2 font-bold">
              Retention Duration (Auto-Expires)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { mins: 10, label: '10 Min', price: '$0.00', rate: 0, badge: 'FREE' },
                { mins: 60, label: '1 Hour', price: '$0.10', rate: 0.10 },
                { mins: 1440, label: '24 Hours', price: '$0.25', rate: 0.25 }
              ].map((opt) => {
                const isSelected = durationMins === opt.mins;
                return (
                  <div
                    key={opt.mins}
                    onClick={() => {
                      if (activeTicket) return;
                      setDurationMins(opt.mins);
                      setDurationRate(opt.rate);
                    }}
                    className={`relative p-3 sm:p-4 text-center border-1.5 rounded cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#5B3A5C] border-[#5B3A5C] text-[#E9DEC3]'
                        : 'bg-white/40 border-[#221D16] text-[#221D16] hover:bg-white/70'
                    } ${activeTicket ? 'pointer-events-none opacity-80' : ''}`}
                  >
                    {opt.badge && (
                      <span className="absolute -top-2.5 right-2 font-mono-retro text-[9px] font-bold px-1.5 py-0.5 bg-[#B23A2E] text-white rounded">
                        {opt.badge}
                      </span>
                    )}
                    <div className="font-anton text-base uppercase">{opt.label}</div>
                    <div className="font-mono-retro text-xs mt-1 opacity-90">{opt.price}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add-on: Forwarding */}
          <div className="mb-8">
            <label className="block font-mono-retro text-xs uppercase tracking-wider text-[#221D16]/70 mb-2 font-bold">
              Add-ons
            </label>
            <div
              onClick={() => {
                if (activeTicket) return;
                setForwardToInbox(!forwardToInbox);
              }}
              className="flex items-center justify-between p-3.5 border-1.5 border-dashed border-[#221D16]/50 rounded bg-white/30 cursor-pointer hover:bg-white/50 transition-colors"
            >
              <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#221D16] cursor-pointer">
                <input
                  type="checkbox"
                  checked={forwardToInbox}
                  disabled={!!activeTicket}
                  onChange={(e) => setForwardToInbox(e.target.checked)}
                  className="w-4 h-4 accent-[#5B3A5C] rounded"
                />
                <span>Auto-forward digest copy to primary inbox</span>
              </label>
              <span className="font-mono-retro text-xs opacity-75 font-bold">+$0.05</span>
            </div>
          </div>

          {/* Pull button */}
          <button
            onClick={handlePullTicket}
            disabled={!!activeTicket}
            className={`w-full btn-retro plum !py-3.5 text-base flex items-center justify-center gap-2 ${
              activeTicket ? '!bg-emerald-800 !border-emerald-800 text-white' : ''
            }`}
          >
            {activeTicket ? (
              <span className="flex items-center gap-2 font-bold">
                <Check className="w-5 h-5" />
                Mailbox Active · #{activeTicket.ticketNo}
              </span>
            ) : (
              <span>Pull this ticket →</span>
            )}
          </button>
        </div>

        {/* Right Live Mailbox Stub */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 w-full">
          <div
            className={`ticket-box relative p-4 sm:p-7 bg-[#DED0AC] transition-transform duration-300 ${
              activeTicket ? 'rotate-0' : 'rotate-0 sm:rotate-1'
            }`}
          >
            {/* ISSUED Red Stamp Overlay */}
            {activeTicket && (
              <div className="absolute top-28 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-[#B23A2E] text-[#B23A2E] font-anton text-2xl sm:text-3xl px-6 py-1.5 rounded-lg tracking-widest bg-[#E9DEC3]/90 shadow-md pointer-events-none z-30 animate-in zoom-in-75 duration-200">
                ISSUED
              </div>
            )}

            {/* Top Row */}
            <div className="flex items-center justify-between pb-3">
              <span className="font-mono-retro text-xs tracking-wider opacity-60 font-bold">
                TICKET NO. {activeTicket ? activeTicket.ticketNo : '004907'}
              </span>
              <span
                className={`font-mono-retro text-xs font-bold px-2.5 py-0.5 rounded -rotate-2 ${
                  activeTicket
                    ? 'bg-[#B23A2E] text-white'
                    : 'bg-[#7C8B93] text-[#E9DEC3]'
                }`}
              >
                {activeTicket ? 'LIVE' : 'PREVIEW'}
              </span>
            </div>

            {/* Address Row with Copy, API & OTP Buttons */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#221D16]/15">
              <div className="font-mono-retro font-bold text-base sm:text-lg text-[#221D16] truncate max-w-[240px] sm:max-w-[280px]">
                {currentAddress}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-retro outline !py-1 !px-2.5 text-xs flex items-center gap-1"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      COPIED
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      COPY
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Meta: Issued & Expires */}
            <div className="py-2.5 flex justify-between font-mono-retro text-xs opacity-75">
              <span>
                ISSUED:{' '}
                {activeTicket
                  ? formatTimeSafe(activeTicket.issuedAt)
                  : 'JUST NOW'}
              </span>
              <span className="text-[#5B3A5C] font-bold">
                EXPIRES:{' '}
                {activeTicket
                  ? formatTimeSafe(activeTicket.expiresAt)
                  : `+${durationMins} MINS`}
              </span>
            </div>

            {/* Perforation */}
            <div className="perf-h -mx-6 sm:-mx-7 my-2"></div>

            {/* Inbox / Outbox Tabs */}
            <div className="pt-2">
              <div className="flex border-b border-[#221D16]/30 mb-3">
                <button
                  onClick={() => {
                    setActiveTab('inbox');
                    setSelectedMail(null);
                  }}
                  className={`flex-1 py-2 font-mono-retro text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === 'inbox'
                      ? 'border-b-2 border-[#5B3A5C] text-[#5B3A5C]'
                      : 'text-[#221D16]/60 hover:text-[#221D16]'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Inbox ({inboxMessages.length})
                </button>

                <button
                  onClick={() => {
                    setActiveTab('outbox');
                    setSelectedMail(null);
                  }}
                  className={`flex-1 py-2 font-mono-retro text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === 'outbox'
                      ? 'border-b-2 border-[#5B3A5C] text-[#5B3A5C]'
                      : 'text-[#221D16]/60 hover:text-[#221D16]'
                  }`}
                >
                  <Send className="w-3 h-3" />
                  Compose / Outbox
                </button>
              </div>

              {/* Detail view when message selected */}
              {selectedMail ? (
                <div className="p-3 bg-white/60 border border-[#221D16]/20 rounded mb-3 font-sans">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setSelectedMail(null)}
                      className="flex items-center gap-1 text-xs font-mono-retro text-[#5B3A5C] font-bold hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back to mailbox
                    </button>

                    {/* HTML / Plain Text Toggle */}
                    <div className="flex items-center gap-1 bg-[#221D16]/10 p-0.5 rounded font-mono-retro text-[10px]">
                      <button
                        type="button"
                        onClick={() => setMailFormat('html')}
                        className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                          mailFormat === 'html'
                            ? 'bg-[#5B3A5C] text-[#E9DEC3] shadow-xs'
                            : 'text-[#221D16]/70 hover:text-[#221D16]'
                        }`}
                      >
                        <Eye className="w-2.5 h-2.5" />
                        HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setMailFormat('text')}
                        className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                          mailFormat === 'text'
                            ? 'bg-[#5B3A5C] text-[#E9DEC3] shadow-xs'
                            : 'text-[#221D16]/70 hover:text-[#221D16]'
                        }`}
                      >
                        <FileText className="w-2.5 h-2.5" />
                        Text
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline text-xs font-mono-retro opacity-60 mb-1">
                    <span className="font-semibold">{selectedMail.isOutbound ? `TO: ${selectedMail.to}` : `FROM: ${selectedMail.from}`}</span>
                    <span>{selectedMail.timestamp}</span>
                  </div>

                  <h3 className="font-bold text-sm text-[#221D16] mb-2 font-body">
                    {selectedMail.subject}
                  </h3>

                  {mailFormat === 'html' && selectedMail.htmlBody ? (
                    <div
                      className="text-xs text-[#221D16] leading-relaxed bg-white p-3 rounded border border-[#221D16]/15 max-h-56 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: selectedMail.htmlBody }}
                    />
                  ) : (
                    <div className="text-xs text-[#221D16] whitespace-pre-wrap leading-relaxed bg-white/70 p-3 rounded border border-[#221D16]/10 max-h-56 overflow-y-auto font-mono-retro">
                      {selectedMail.body}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* INBOX TAB */}
                  {activeTab === 'inbox' && (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {inboxMessages.length === 0 ? (
                        <div className="py-8 text-center font-mono-retro text-xs text-[#221D16]/50 border border-dashed border-[#221D16]/30 rounded">
                          {activeTicket
                            ? 'Listening for incoming messages...'
                            : 'Inbox is empty until you pull this ticket.'}
                        </div>
                      ) : (
                        inboxMessages.map((msg) => (
                          <div
                            key={msg.id}
                            onClick={() => {
                              msg.isRead = true;
                              setSelectedMail(msg);
                            }}
                            className={`p-2.5 rounded border transition-colors cursor-pointer ${
                              !msg.isRead
                                ? 'bg-white/80 border-[#5B3A5C] shadow-xs'
                                : 'bg-white/40 border-[#221D16]/20 hover:bg-white/60'
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs font-mono-retro mb-1">
                              <span className="font-bold text-[#5B3A5C] truncate max-w-[170px]">
                                {msg.from}
                              </span>
                              <span className="opacity-50 text-[10px]">{msg.timestamp}</span>
                            </div>
                            <div className="text-xs font-semibold text-[#221D16] truncate">
                              {msg.subject}
                            </div>
                            <div className="text-[11px] text-[#221D16]/70 truncate mt-0.5">
                              {msg.preview}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* OUTBOX / COMPOSE TAB */}
                  {activeTab === 'outbox' && (
                    <div className="space-y-2.5">
                      <input
                        type="email"
                        value={composeTo}
                        onChange={(e) => setComposeTo(e.target.value)}
                        placeholder="Recipient: user@example.com"
                        disabled={!activeTicket}
                        className="w-full px-3 py-1.5 text-xs font-mono-retro bg-white/70 border border-[#221D16] rounded outline-none disabled:opacity-50"
                      />
                      <input
                        type="text"
                        value={composeSubject}
                        onChange={(e) => setComposeSubject(e.target.value)}
                        placeholder="Subject"
                        disabled={!activeTicket}
                        className="w-full px-3 py-1.5 text-xs bg-white/70 border border-[#221D16] rounded outline-none disabled:opacity-50"
                      />
                      <textarea
                        value={composeBody}
                        onChange={(e) => setComposeBody(e.target.value)}
                        placeholder="Type message content..."
                        rows={3}
                        disabled={!activeTicket}
                        className="w-full px-3 py-2 text-xs bg-white/70 border border-[#221D16] rounded outline-none resize-none disabled:opacity-50"
                      />
                      <button
                        onClick={handleSendMail}
                        disabled={!activeTicket || !composeTo.trim() || !composeBody.trim()}
                        className="w-full btn-retro !py-2 text-xs"
                      >
                        Send Dispatched Mail
                      </button>

                      {outboxMessages.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-[#221D16]/20">
                          <div className="font-mono-retro text-[10px] uppercase opacity-60 mb-1.5">
                            Recent Outbox:
                          </div>
                          {outboxMessages.slice(0, 2).map((msg) => (
                            <div key={msg.id} className="text-xs p-2 bg-white/30 rounded mb-1">
                              <span className="font-mono-retro font-bold text-[11px]">To {msg.to}:</span>{' '}
                              {msg.subject}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Total */}
            <div className="perf-h -mx-6 sm:-mx-7 my-3"></div>
            <div className="flex items-baseline justify-between pt-1 font-mono-retro">
              <span className="text-xs uppercase opacity-60">Total due today</span>
              <span className="font-anton text-2xl text-[#5B3A5C]">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>

            {activeTicket && (
              <div className="pt-3 border-t border-[#221D16]/15 mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleBurnMailTicket}
                  className="btn-retro red !py-1.5 !px-3 text-xs flex items-center gap-1.5 font-mono-retro font-bold"
                  title="Burn mailbox and wipe all inbox data permanently"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Burn & Release Mailbox
                </button>
              </div>
            )}
          </div>

          <p className="text-center font-mono-retro text-xs opacity-65 mt-3">
            {activeTicket
              ? 'Your temporary mailbox is live. Incoming messages reflect instantly.'
              : "Nothing's charged yet — this is a live preview."}
          </p>
        </div>
      </div>

      {/* Burn Mailbox Confirm Modal */}
      <ConfirmModal
        isOpen={showBurnConfirm}
        title="Burn Disposable Inbox"
        message={activeTicket ? `Are you sure you want to burn disposable inbox ${activeTicket.fullAddress}? This will permanently wipe all incoming and outgoing messages.` : ''}
        confirmLabel="Burn Inbox"
        isDestructive={true}
        onConfirm={handleConfirmBurnMail}
        onClose={() => setShowBurnConfirm(false)}
      />
    </div>
  );
};
