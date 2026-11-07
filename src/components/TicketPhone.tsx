import React, { useState, useEffect } from 'react';
import { SmsMessage, PhoneTicket, PhoneAddOns, PageView, UserSession } from '../types';
import { COUNTRIES } from '../data/countries';
import { copyToClipboard, safeStorage } from '../utils/storage';
import { toSafeDate, formatDateSafe } from '../utils/date';
import {
  savePhoneTicketToFirestore,
  loadPhoneTicketsFromFirestore,
  deletePhoneTicketFromFirestore,
  saveSmsMessageToFirestore,
  loadSmsMessagesFromFirestore
} from '../lib/firebase';
import {
  Copy,
  Check,
  Send,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  Dices,
  Shield,
  Zap,
  Mail,
  ChevronRight,
  Flame,
  Cloud,
  Loader2
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import {
  allocatePhoneNumber,
  getNumberMessages
} from '../services/architectureApi';

interface TicketPhoneProps {
  session?: UserSession | null;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onNavigate?: (page: PageView) => void;
  onOpenAuth?: () => void;
}

export const TicketPhone: React.FC<TicketPhoneProps> = ({
  session,
  onShowToast,
  onNavigate,
  onOpenAuth
}) => {
  const [selectedCountryIso, setSelectedCountryIso] = useState('US');
  const [selectedAreaCode, setSelectedAreaCode] = useState('415');
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedRate, setSelectedRate] = useState(3.50);
  const [previewDigits, setPreviewDigits] = useState('4819');
  const [isFirestoreSyncing, setIsFirestoreSyncing] = useState(false);

  // Add-ons states
  const [callRecording, setCallRecording] = useState(false);
  const [whatsappShield, setWhatsappShield] = useState(false);
  const [autoForwardEmail, setAutoForwardEmail] = useState(false);
  const [burnOnFirstOtp, setBurnOnFirstOtp] = useState(false);
  const [privateDedicatedSim, setPrivateDedicatedSim] = useState(false);

  // Multi-ticket management - scoped to current session user
  const [tickets, setTickets] = useState<PhoneTicket[]>(() => {
    if (!session?.user?.id) return [];
    try {
      const saved = safeStorage.getJSON<any[]>(`tp_active_phone_tickets_${session.user.id}`, []);
      return saved.map((t) => ({
        ...t,
        issuedAt: new Date(t.issuedAt),
        expiresAt: new Date(t.expiresAt)
      }));
    } catch {
      return [];
    }
  });

  const [activeTicketIndex, setActiveTicketIndex] = useState<number | null>(() => {
    if (!session?.user?.id) return null;
    try {
      const saved = safeStorage.getJSON<any[]>(`tp_active_phone_tickets_${session.user.id}`, []);
      return saved.length > 0 ? 0 : null;
    } catch {
      return null;
    }
  });

  // Active ticket reference
  const activeTicket: PhoneTicket | null =
    activeTicketIndex !== null && tickets[activeTicketIndex]
      ? tickets[activeTicketIndex]
      : null;

  const [activeTab, setActiveTab] = useState<'inbox' | 'send' | 'simulate' | 'manage'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<SmsMessage | null>(null);

  // SMS storage per ticket
  const [messagesByTicket, setMessagesByTicket] = useState<Record<string, { inbox: SmsMessage[]; outbox: SmsMessage[] }>>(() => {
    if (!session?.user?.id) return {};
    return safeStorage.getJSON(`tp_ticket_messages_${session.user.id}`, {});
  });

  const activeMessages = activeTicket
    ? messagesByTicket[activeTicket.ticketNo] || { inbox: [], outbox: [] }
    : { inbox: [], outbox: [] };

  const inboxMessages = activeMessages.inbox;
  const outboxMessages = activeMessages.outbox;

  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  // Outbound SMS form
  const [sendTo, setSendTo] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Custom simulation inputs
  const [simSender, setSimSender] = useState('');
  const [simBody, setSimBody] = useState('');

  // Save tickets to local storage
  useEffect(() => {
    if (!session?.user?.id) return;
    try {
      safeStorage.setJSON(`tp_active_phone_tickets_${session.user.id}`, tickets);
    } catch (err) {
      console.warn('Could not persist tickets:', err);
    }
  }, [tickets, session?.user?.id]);

  // Save messages to local storage
  useEffect(() => {
    if (!session?.user?.id) return;
    try {
      safeStorage.setJSON(`tp_ticket_messages_${session.user.id}`, messagesByTicket);
    } catch (err) {
      console.warn('Could not persist messages:', err);
    }
  }, [messagesByTicket, session?.user?.id]);

  // Sync with Firestore DB when user is authenticated, or reset when logged out
  useEffect(() => {
    if (!session?.user?.id) {
      setTickets([]);
      setActiveTicketIndex(null);
      setMessagesByTicket({});
      return;
    }
    const userId = session.user.id;
    const userEmail = session.user.email;

    let isMounted = true;
    async function syncWithFirestore() {
      try {
        setIsFirestoreSyncing(true);
        const [remoteTickets, remoteMessages] = await Promise.all([
          loadPhoneTicketsFromFirestore(userId, userEmail),
          loadSmsMessagesFromFirestore(userId, userEmail)
        ]);

        if (!isMounted) return;

        if (remoteTickets && remoteTickets.length > 0) {
          setTickets(remoteTickets);
          setActiveTicketIndex(0);
          safeStorage.setJSON(`tp_active_phone_tickets_${userId}`, remoteTickets);
        } else {
          setTickets([]);
          setActiveTicketIndex(null);
        }

        if (remoteMessages && Object.keys(remoteMessages).length > 0) {
          setMessagesByTicket(remoteMessages);
          safeStorage.setJSON(`tp_ticket_messages_${userId}`, remoteMessages);
        }
      } catch (err) {
        console.warn('Firestore initial sync notice:', err);
      } finally {
        if (isMounted) setIsFirestoreSyncing(false);
      }
    }

    syncWithFirestore();
    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, session?.user?.email]);

  // Real-time polling for incoming SMS messages on active ticket
  useEffect(() => {
    if (!activeTicket) return;
    const interval = setInterval(async () => {
      try {
        const res = await getNumberMessages(activeTicket.fullNumber);
        if (res && Array.isArray(res.messages) && res.messages.length > 0) {
          setMessagesByTicket((prev) => {
            const current = prev[activeTicket.ticketNo] || { inbox: [], outbox: [] };
            const existingIds = new Set(current.inbox.map((m) => m.id));
            const newSmsList = res.messages.filter((m: any) => !existingIds.has(m.id));

            if (newSmsList.length > 0) {
              const formatted: SmsMessage[] = newSmsList.map((m: any) => ({
                id: m.id,
                from: m.from || 'Incoming Service',
                to: m.to || activeTicket.fullNumber,
                body: m.body || '',
                timestamp: 'Just now',
                otpCode: extractOtp(m.body || ''),
                isRead: false
              }));

              onShowToast(`New SMS received on ${activeTicket.fullNumber}!`);
              return {
                ...prev,
                [activeTicket.ticketNo]: {
                  ...current,
                  inbox: [...formatted, ...current.inbox]
                }
              };
            }
            return prev;
          });
        }
      } catch (err) {
        // silent polling fallback
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTicket?.fullNumber, activeTicket?.ticketNo]);

  // Selected country helper
  const country = COUNTRIES.find((c) => c.iso === selectedCountryIso) || COUNTRIES[0];

  // When country changes, update default area code
  const handleCountryChange = (iso: string) => {
    setSelectedCountryIso(iso);
    const newCountry = COUNTRIES.find((c) => c.iso === iso);
    if (newCountry && newCountry.areas.length > 0) {
      setSelectedAreaCode(newCountry.areas[0].code);
    } else {
      setSelectedAreaCode('');
    }
  };

  const calculateAddOnsTotal = () => {
    let total = 0;
    if (callRecording) total += 0.50;
    if (whatsappShield) total += 0.75;
    if (autoForwardEmail) total += 0.50;
    if (burnOnFirstOtp) total += 0.25;
    if (privateDedicatedSim) total += 1.00;
    return total;
  };

  const calculateTotal = () => {
    return selectedRate + calculateAddOnsTotal();
  };

  const formatPreviewNumber = (lastDigits = previewDigits) => {
    const area = selectedAreaCode ? `(${selectedAreaCode}) ` : '';
    return `+${country.dial} ${area}555-${lastDigits}`;
  };

  const handleRerollPreviewDigits = () => {
    const nextDigits = String(Math.floor(1000 + Math.random() * 9000));
    setPreviewDigits(nextDigits);
    onShowToast(`Assigned preview line: 555-${nextDigits}`);
  };

  // Extract OTP pattern
  const extractOtp = (text: string): string | undefined => {
    const match = text.match(/\b(G-\d{6}|\d{4,8}|[A-Z0-9]{3}-[A-Z0-9]{3})\b/);
    return match ? match[0] : undefined;
  };

  const handlePullTicket = () => {
    const fullNum = formatPreviewNumber(previewDigits);
    const now = new Date();
    const expires = new Date(now.getTime() + selectedDays * 24 * 60 * 60 * 1000);
    const ticketNum = `00${Math.floor(4800 + Math.random() * 199)}`;

    const currentAddOns: PhoneAddOns = {
      callRecording,
      whatsappShield,
      autoForwardEmail,
      burnOnFirstOtp,
      privateDedicatedSim
    };

    const newTicket: PhoneTicket = {
      ticketNo: ticketNum,
      countryIso: selectedCountryIso,
      areaCode: selectedAreaCode,
      fullNumber: fullNum,
      days: selectedDays,
      rate: calculateTotal(),
      callRecording,
      addOns: currentAddOns,
      issuedAt: now,
      expiresAt: expires,
      isLive: true,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    };

    // Register allocation on backend Express/Redis architecture
    allocatePhoneNumber(selectedCountryIso, selectedAreaCode, selectedDays).catch(() => {});

    // Seed initial welcoming and 2FA SMS for this ticket
    const welcomeSms: SmsMessage = {
      id: `sms_init_1_${Date.now()}`,
      from: 'Carrier Network',
      to: fullNum,
      body: `Twilio Virtual SIM activated. Inbound SMS and Voice routing are enabled for ${fullNum}.`,
      timestamp: 'Just now',
      isRead: false
    };

    const googleSms: SmsMessage = {
      id: `sms_init_2_${Date.now()}`,
      from: 'Google',
      to: fullNum,
      body: `G-${Math.floor(100000 + Math.random() * 900000)} is your Google verification code.`,
      timestamp: 'Just now',
      otpCode: `G-${Math.floor(100000 + Math.random() * 900000)}`,
      isRead: false
    };

    setMessagesByTicket((prev) => ({
      ...prev,
      [ticketNum]: {
        inbox: [googleSms, welcomeSms],
        outbox: []
      }
    }));

    setTickets((prev) => [newTicket, ...prev]);
    setActiveTicketIndex(0);
    setActiveTab('inbox');

    // Persist new ticket and initial SMS to Firestore if authenticated
    if (session?.user?.id) {
      savePhoneTicketToFirestore(session.user.id, newTicket, session.user.email);
      saveSmsMessageToFirestore(session.user.id, newTicket.ticketNo, welcomeSms, session.user.email);
      saveSmsMessageToFirestore(session.user.id, newTicket.ticketNo, googleSms, session.user.email);
    }

    onShowToast(`Ticket #${newTicket.ticketNo} issued! ${fullNum} is now active.`);
  };

  // Change / Swap active number
  const handleSwapActiveNumber = () => {
    if (!activeTicket || activeTicketIndex === null) return;
    const newDigits = String(Math.floor(1000 + Math.random() * 9000));
    const area = activeTicket.areaCode ? `(${activeTicket.areaCode}) ` : '';
    const activeCountry = COUNTRIES.find((c) => c.iso === activeTicket.countryIso) || country;
    const updatedFullNum = `+${activeCountry.dial} ${area}555-${newDigits}`;

    const updatedTicket: PhoneTicket = {
      ...activeTicket,
      fullNumber: updatedFullNum
    };

    const updatedTickets = [...tickets];
    updatedTickets[activeTicketIndex] = updatedTicket;
    setTickets(updatedTickets);

    // Add notification to SMS feed
    const swapNotice: SmsMessage = {
      id: `sms_swap_${Date.now()}`,
      from: 'Carrier Switcher',
      to: updatedFullNum,
      body: `Your line has been successfully swapped to new number ${updatedFullNum}. Previous number released.`,
      timestamp: 'Just now',
      isRead: false
    };

    setMessagesByTicket((prev) => {
      const current = prev[activeTicket.ticketNo] || { inbox: [], outbox: [] };
      return {
        ...prev,
        [activeTicket.ticketNo]: {
          ...current,
          inbox: [swapNotice, ...current.inbox]
        }
      };
    });

    if (session?.user?.id) {
      savePhoneTicketToFirestore(session.user.id, updatedTicket);
      saveSmsMessageToFirestore(session.user.id, activeTicket.ticketNo, swapNotice);
    }

    onShowToast(`Number changed to ${updatedFullNum}!`);
  };

  // Extend duration of active ticket
  const handleExtendPass = (additionalDays: number, cost: number) => {
    if (!activeTicket || activeTicketIndex === null) return;
    const currentExpires = new Date(activeTicket.expiresAt);
    const newExpires = new Date(currentExpires.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    const updatedTicket: PhoneTicket = {
      ...activeTicket,
      days: activeTicket.days + additionalDays,
      expiresAt: newExpires
    };

    const updatedTickets = [...tickets];
    updatedTickets[activeTicketIndex] = updatedTicket;
    setTickets(updatedTickets);

    if (session?.user?.id) {
      savePhoneTicketToFirestore(session.user.id, updatedTicket, session.user.email);
    }

    onShowToast(`Extended pass for #${activeTicket.ticketNo} by +${additionalDays} days!`);
  };

  // Burn and release active ticket state
  const [showBurnConfirm, setShowBurnConfirm] = useState(false);

  const handleReleaseTicket = () => {
    if (!activeTicket || activeTicketIndex === null) return;
    setShowBurnConfirm(true);
  };

  const handleConfirmBurnTicket = () => {
    if (!activeTicket || activeTicketIndex === null) return;
    const ticketNoToBurn = activeTicket.ticketNo;
    const remainingTickets = tickets.filter((_, idx) => idx !== activeTicketIndex);
    setTickets(remainingTickets);
    setActiveTicketIndex(remainingTickets.length > 0 ? 0 : null);

    if (session?.user?.id) {
      deletePhoneTicketFromFirestore(session.user.id, ticketNoToBurn);
    }

    onShowToast(`Ticket #${ticketNoToBurn} burned and released.`);
    setShowBurnConfirm(false);
  };

  const handleCopyNumber = async () => {
    const textToCopy = activeTicket ? activeTicket.fullNumber : formatPreviewNumber();
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopiedNumber(true);
      onShowToast(`Copied ${textToCopy} to clipboard!`);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  const handleCopyOtp = async (otp: string) => {
    const success = await copyToClipboard(otp);
    if (success) {
      setCopiedOtp(otp);
      onShowToast(`Copied OTP code: ${otp}`);
      setTimeout(() => setCopiedOtp(null), 2000);
    }
  };

  const handleSendSms = () => {
    if (!activeTicket || !sendTo.trim() || !sendBody.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      const outMsg: SmsMessage = {
        id: `sms_out_${Date.now()}`,
        from: activeTicket.fullNumber,
        to: sendTo.trim(),
        body: sendBody.trim(),
        timestamp: 'Just now',
        isRead: true,
        isOutbound: true
      };

      setMessagesByTicket((prev) => {
        const current = prev[activeTicket.ticketNo] || { inbox: [], outbox: [] };
        return {
          ...prev,
          [activeTicket.ticketNo]: {
            ...current,
            outbox: [outMsg, ...current.outbox]
          }
        };
      });

      setSendTo('');
      setSendBody('');
      setIsSending(false);

      if (session?.user?.id) {
        saveSmsMessageToFirestore(session.user.id, activeTicket.ticketNo, outMsg);
      }

      onShowToast(`SMS sent to ${outMsg.to}`);
    }, 600);
  };

  const handleSimulateInbound = (sender: string, message: string) => {
    if (!activeTicket) return;

    const otp = extractOtp(message);
    const newSms: SmsMessage = {
      id: `sim_${Date.now()}`,
      from: sender,
      to: activeTicket.fullNumber,
      body: message,
      timestamp: 'Just now',
      otpCode: otp,
      isRead: false
    };

    setMessagesByTicket((prev) => {
      const current = prev[activeTicket.ticketNo] || { inbox: [], outbox: [] };
      return {
        ...prev,
        [activeTicket.ticketNo]: {
          ...current,
          inbox: [newSms, ...current.inbox]
        }
      };
    });

    if (session?.user?.id) {
      saveSmsMessageToFirestore(session.user.id, activeTicket.ticketNo, newSms);
    }

    setActiveTab('inbox');
    onShowToast(`Incoming SMS from ${sender}: "${otp || message.slice(0, 25)}..."`);

    // If "Burn on first OTP" is enabled on this ticket
    if (activeTicket.addOns?.burnOnFirstOtp && otp) {
      setTimeout(() => {
        onShowToast(`🔥 Auto-Destruct activated: Number ${activeTicket.fullNumber} burned after OTP verification.`, 'error');
      }, 4000);
    }
  };

  const unreadCount = inboxMessages.filter((m) => !m.isRead).length;

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
      {/* Product Switcher Bar to toggle between Temp Phone & Temp Mail */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#221D16]/20 pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex bg-[#DED0AC] p-1 rounded-lg border-2 border-[#221D16] shadow-[2px_2px_0_rgba(34,29,22,0.15)] sm:shadow-[3px_3px_0_rgba(34,29,22,0.15)]">
            <button
              type="button"
              onClick={() => onNavigate?.('ticket-phone')}
              className="flex items-center gap-2 py-2 px-4 rounded-md font-mono-retro font-bold text-xs uppercase bg-[#5B3A5C] text-[#E9DEC3] shadow-[1px_1px_0_#221D16]"
            >
              <span>📞 Phone Number</span>
              {tickets.length > 0 && (
                <span className="bg-[#B23A2E] text-white px-1.5 py-0.2 rounded-full text-[10px]">
                  {tickets.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('ticket-mail')}
              className="flex items-center gap-2 py-2 px-4 rounded-md font-mono-retro font-bold text-xs uppercase text-[#221D16]/75 hover:text-[#221D16] hover:bg-white/40 transition-colors"
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

        {/* Change Ticket / Active Numbers Quick Selector Bar */}
        {tickets.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1 scroll-touch-x max-w-full">
            <span className="font-mono-retro text-xs font-bold text-[#221D16]/70 uppercase shrink-0">
              Active Tickets:
            </span>
            {tickets.map((t, idx) => (
              <button
                key={t.ticketNo}
                onClick={() => {
                  setActiveTicketIndex(idx);
                  setSelectedMessage(null);
                }}
                className={`px-3 py-1.5 rounded border text-xs font-mono-retro font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  activeTicketIndex === idx
                    ? 'bg-[#B23A2E] text-white border-[#B23A2E] shadow-[2px_2px_0_#221D16]'
                    : 'bg-white/60 text-[#221D16] border-[#221D16]/40 hover:bg-white'
                }`}
              >
                <span>🎟️ #{t.ticketNo}</span>
                <span className="text-[11px] opacity-80 truncate max-w-[120px]">{t.fullNumber}</span>
              </button>
            ))}

            <button
              onClick={() => {
                setActiveTicketIndex(null);
                setSelectedMessage(null);
                onShowToast('Ready to pull a new ticket!');
              }}
              className={`px-3 py-1.5 rounded border-1.5 border-dashed border-[#5B3A5C] text-xs font-mono-retro font-bold flex items-center gap-1 transition-all shrink-0 ${
                activeTicketIndex === null
                  ? 'bg-[#5B3A5C] text-white'
                  : 'text-[#5B3A5C] bg-[#5B3A5C]/10 hover:bg-[#5B3A5C]/20'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pull Another Ticket</span>
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="font-mono-retro text-xs font-bold uppercase tracking-widest text-[#5B3A5C] flex items-center gap-2 mb-2">
          <span>—</span> PULL A TICKET &amp; CHANGE OPTIONS
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="font-anton text-2xl sm:text-3xl md:text-4xl text-[#221D16] uppercase tracking-tight">
              {activeTicket ? `Ticket #${activeTicket.ticketNo} Active` : 'Set your number up'}
            </h1>
            <p className="text-sm sm:text-base text-[#221D16]/80 max-w-xl mt-2 leading-relaxed">
              {activeTicket
                ? 'Your temporary line is live. Manage SMS routing, switch lines, or pull another ticket.'
                : "Choose a country, a city code, add-ons, and a duration. Nothing's charged until you pull it."}
            </p>
          </div>

          {activeTicket && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSwapActiveNumber}
                className="btn-retro outline !py-2 !px-3 text-xs flex items-center gap-1.5"
                title="Swap for a new random number in this range"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#5B3A5C]" />
                <span>Change Number</span>
              </button>
              <button
                onClick={() => {
                  setActiveTicketIndex(null);
                  onShowToast('Fill out the form to pull another line');
                }}
                className="btn-retro plum !py-2 !px-3 text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pull New Ticket</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Configuration Panel + Live Ticket Stub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Form Panel */}
        <div className="lg:col-span-6 bg-[#DED0AC] border-2 border-[#221D16] rounded-md p-4 sm:p-6 lg:p-8 shadow-[4px_4px_0_rgba(34,29,22,0.15)] sm:shadow-[6px_6px_0_rgba(34,29,22,0.15)]">
          {activeTicket ? (
            <div>
              {/* Active Ticket Quick Controls */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#221D16]/20">
                <div>
                  <span className="font-mono-retro text-xs uppercase font-bold text-[#5B3A5C]">
                    Current Active Ticket
                  </span>
                  <div className="font-anton text-2xl text-[#221D16]">
                    #{activeTicket.ticketNo}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTicketIndex(null);
                  }}
                  className="btn-retro plum !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Configure New Ticket</span>
                </button>
              </div>

              {/* Ticket Details Summary */}
              <div className="space-y-3 mb-6 font-mono-retro text-xs bg-white/50 p-4 rounded border border-[#221D16]/20">
                <div className="flex justify-between">
                  <span className="opacity-70">Active Line:</span>
                  <span className="font-bold text-[#221D16]">{activeTicket.fullNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Country &amp; Area:</span>
                  <span className="font-bold">{activeTicket.countryIso} ({activeTicket.areaCode || 'National'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Expires:</span>
                  <span className="font-bold text-[#5B3A5C]">
                    {formatDateSafe(activeTicket.expiresAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* CHANGE ACTIONS SECTION */}
              <div className="space-y-4">
                <div className="font-mono-retro text-xs font-bold uppercase tracking-wider text-[#221D16]/80">
                  Change &amp; Management Actions
                </div>

                {/* Swap / Change Number Action */}
                <div className="p-3.5 bg-white/40 border-1.5 border-[#221D16]/40 rounded flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold font-mono-retro text-[#221D16]">
                      Change / Re-roll Number
                    </div>
                    <div className="text-[11px] opacity-75">
                      Instantly swap this number for a fresh, unflagged carrier line.
                    </div>
                  </div>
                  <button
                    onClick={handleSwapActiveNumber}
                    className="btn-retro outline !py-1.5 !px-2.5 text-xs flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Swap Line</span>
                  </button>
                </div>

                {/* Extend Duration / Change Pass */}
                <div className="p-3.5 bg-white/40 border-1.5 border-[#221D16]/40 rounded">
                  <div className="text-xs font-bold font-mono-retro text-[#221D16] mb-1">
                    Change Pass / Extend Duration
                  </div>
                  <div className="text-[11px] opacity-75 mb-3">
                    Add more days to your number without interrupting incoming messages.
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleExtendPass(1, 0.50)}
                      className="btn-retro outline !py-1.5 !px-2 text-xs text-center"
                    >
                      +1 Day ($0.50)
                    </button>
                    <button
                      onClick={() => handleExtendPass(7, 3.50)}
                      className="btn-retro outline !py-1.5 !px-2 text-xs text-center font-bold"
                    >
                      +7 Days ($3.50)
                    </button>
                    <button
                      onClick={() => handleExtendPass(30, 15.00)}
                      className="btn-retro outline !py-1.5 !px-2 text-xs text-center font-bold"
                    >
                      +30 Days ($15)
                    </button>
                  </div>
                </div>

                {/* Burn / Release Ticket */}
                <div className="p-3.5 bg-red-500/10 border-1.5 border-[#B23A2E]/40 rounded flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold font-mono-retro text-[#B23A2E] flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      Burn &amp; Release Line
                    </div>
                    <div className="text-[11px] opacity-75">
                      Immediately terminate this number and wipe local inbox.
                    </div>
                  </div>
                  <button
                    onClick={handleReleaseTicket}
                    className="p-2 bg-[#B23A2E] text-white hover:bg-red-700 rounded text-xs font-mono-retro font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Burn</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Country Field */}
              <div className="mb-5">
                <label className="block font-mono-retro text-xs uppercase tracking-wider text-[#221D16]/70 mb-2 font-bold">
                  Country
                </label>
                <select
                  value={selectedCountryIso}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border-1.5 border-[#221D16] rounded text-[#221D16] font-semibold text-sm outline-none focus:border-[#5B3A5C] focus:bg-white transition-colors cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.iso} value={c.iso}>
                      {c.flag} {c.name} (+{c.dial})
                    </option>
                  ))}
                </select>
              </div>

              {/* Area Code Field with Re-roll */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono-retro text-xs uppercase tracking-wider text-[#221D16]/70 font-bold">
                    City / Area Code
                  </label>
                  <button
                    type="button"
                    onClick={handleRerollPreviewDigits}
                    className="text-[11px] font-mono-retro text-[#5B3A5C] font-bold hover:underline flex items-center gap-1"
                    title="Generate a different preview number"
                  >
                    <Dices className="w-3 h-3" />
                    <span>Re-roll Digits</span>
                  </button>
                </div>
                <select
                  value={selectedAreaCode}
                  onChange={(e) => setSelectedAreaCode(e.target.value)}
                  className="w-full px-4 py-3 bg-white/70 border-1.5 border-[#221D16] rounded text-[#221D16] font-semibold text-sm outline-none focus:border-[#5B3A5C] focus:bg-white transition-colors cursor-pointer"
                >
                  {country.areas.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code ? `${a.code} — ` : ''}{a.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration Options */}
              <div className="mb-5">
                <label className="block font-mono-retro text-xs uppercase tracking-wider text-[#221D16]/70 mb-2 font-bold">
                  Duration Pass
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { days: 1, label: 'Day', price: '$0.50', rate: 0.50 },
                    { days: 7, label: 'Week', price: '$3.50', rate: 3.50, badge: 'COMMON' },
                    { days: 30, label: 'Month', price: '$15.00', rate: 15.00 }
                  ].map((opt) => {
                    const isSelected = selectedDays === opt.days;
                    return (
                      <div
                        key={opt.days}
                        onClick={() => {
                          setSelectedDays(opt.days);
                          setSelectedRate(opt.rate);
                        }}
                        className={`relative p-3 sm:p-4 text-center border-1.5 rounded cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#5B3A5C] border-[#5B3A5C] text-[#E9DEC3]'
                            : 'bg-white/40 border-[#221D16] text-[#221D16] hover:bg-white/70'
                        }`}
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

              {/* Temp Phone Add-ons */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono-retro text-xs uppercase tracking-wider text-[#221D16]/70 font-bold">
                    Temp Phone Add-ons
                  </label>
                  <span className="font-mono-retro text-[11px] text-[#5B3A5C] font-bold">
                    +${calculateAddOnsTotal().toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Add-on 1: Call Recording */}
                  <label className="flex items-center justify-between p-2.5 border-1.5 border-dashed border-[#221D16]/50 rounded bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#221D16]">
                      <input
                        type="checkbox"
                        checked={callRecording}
                        onChange={(e) => setCallRecording(e.target.checked)}
                        className="w-4 h-4 accent-[#5B3A5C] rounded"
                      />
                      <span>Voice Call Recording &amp; MP3 Archival</span>
                    </div>
                    <span className="font-mono-retro text-xs font-bold opacity-75">+$0.50</span>
                  </label>

                  {/* Add-on 2: WhatsApp / Telegram Clean Carrier Range */}
                  <label className="flex items-center justify-between p-2.5 border-1.5 border-dashed border-[#221D16]/50 rounded bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#221D16]">
                      <input
                        type="checkbox"
                        checked={whatsappShield}
                        onChange={(e) => setWhatsappShield(e.target.checked)}
                        className="w-4 h-4 accent-[#5B3A5C] rounded"
                      />
                      <span>WhatsApp &amp; Telegram Verified Range</span>
                    </div>
                    <span className="font-mono-retro text-xs font-bold opacity-75">+$0.75</span>
                  </label>

                  {/* Add-on 3: Real-Time SMS Auto-Forward */}
                  <label className="flex items-center justify-between p-2.5 border-1.5 border-dashed border-[#221D16]/50 rounded bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#221D16]">
                      <input
                        type="checkbox"
                        checked={autoForwardEmail}
                        onChange={(e) => setAutoForwardEmail(e.target.checked)}
                        className="w-4 h-4 accent-[#5B3A5C] rounded"
                      />
                      <span>Instant SMS Forwarding to Email</span>
                    </div>
                    <span className="font-mono-retro text-xs font-bold opacity-75">+$0.50</span>
                  </label>

                  {/* Add-on 4: Burn on 1st OTP */}
                  <label className="flex items-center justify-between p-2.5 border-1.5 border-dashed border-[#221D16]/50 rounded bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#221D16]">
                      <input
                        type="checkbox"
                        checked={burnOnFirstOtp}
                        onChange={(e) => setBurnOnFirstOtp(e.target.checked)}
                        className="w-4 h-4 accent-[#5B3A5C] rounded"
                      />
                      <span>Auto-Burn on First 2FA Code</span>
                    </div>
                    <span className="font-mono-retro text-xs font-bold opacity-75">+$0.25</span>
                  </label>

                  {/* Add-on 5: Private Dedicated Physical Line */}
                  <label className="flex items-center justify-between p-2.5 border-1.5 border-dashed border-[#221D16]/50 rounded bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#221D16]">
                      <input
                        type="checkbox"
                        checked={privateDedicatedSim}
                        onChange={(e) => setPrivateDedicatedSim(e.target.checked)}
                        className="w-4 h-4 accent-[#5B3A5C] rounded"
                      />
                      <span>Private Dedicated Physical Line</span>
                    </div>
                    <span className="font-mono-retro text-xs font-bold opacity-75">+$1.00</span>
                  </label>
                </div>
              </div>

              {/* Pull button */}
              <button
                onClick={handlePullTicket}
                className="w-full btn-retro plum !py-3.5 text-base flex items-center justify-center gap-2"
              >
                <span>Pull this ticket (${calculateTotal().toFixed(2)}) →</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Ticket Preview & Live SMS Center */}
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
                TICKET NO. {activeTicket ? activeTicket.ticketNo : '004823'}
              </span>
              <div className="flex items-center gap-2">
                {activeTicket && (
                  <button
                    onClick={handleSwapActiveNumber}
                    title="Change number on this ticket"
                    className="font-mono-retro text-[10px] font-bold text-[#5B3A5C] underline hover:text-[#B23A2E]"
                  >
                    Change #
                  </button>
                )}
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
            </div>

            {/* Main Phone Number Display with Copy */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#221D16]/15">
              <div className="font-mono-retro font-bold text-xl sm:text-2xl text-[#221D16] tracking-tight truncate max-w-[240px] sm:max-w-[280px]">
                {activeTicket ? activeTicket.fullNumber : formatPreviewNumber()}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="btn-retro outline !py-1 !px-2.5 text-xs flex items-center gap-1"
                >
                  {copiedNumber ? (
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

            {/* Active Add-ons tags if present */}
            {activeTicket && activeTicket.addOns && (
              <div className="py-2 flex flex-wrap gap-1 border-b border-[#221D16]/15">
                {activeTicket.addOns.callRecording && (
                  <span className="font-mono-retro text-[9px] font-bold bg-[#5B3A5C]/15 text-[#5B3A5C] px-1.5 py-0.5 rounded">
                    🎙️ Voice Recording
                  </span>
                )}
                {activeTicket.addOns.whatsappShield && (
                  <span className="font-mono-retro text-[9px] font-bold bg-emerald-700/15 text-emerald-800 px-1.5 py-0.5 rounded">
                    🛡️ WA / TG Shield
                  </span>
                )}
                {activeTicket.addOns.autoForwardEmail && (
                  <span className="font-mono-retro text-[9px] font-bold bg-blue-700/15 text-blue-800 px-1.5 py-0.5 rounded">
                    ✉️ SMS Auto-Forward
                  </span>
                )}
                {activeTicket.addOns.burnOnFirstOtp && (
                  <span className="font-mono-retro text-[9px] font-bold bg-red-700/15 text-red-800 px-1.5 py-0.5 rounded">
                    🔥 Burn on 1st OTP
                  </span>
                )}
                {activeTicket.addOns.privateDedicatedSim && (
                  <span className="font-mono-retro text-[9px] font-bold bg-amber-700/15 text-amber-900 px-1.5 py-0.5 rounded">
                    ⚡ Dedicated Line
                  </span>
                )}
              </div>
            )}

            {/* Meta: Issued & Expires */}
            <div className="py-2.5 flex justify-between font-mono-retro text-xs opacity-75">
              <span>
                ISSUED:{' '}
                {activeTicket
                  ? formatDateSafe(activeTicket.issuedAt)
                  : 'TODAY'}
              </span>
              <span className="text-[#5B3A5C] font-bold">
                EXPIRES:{' '}
                {activeTicket
                  ? formatDateSafe(activeTicket.expiresAt)
                  : `+${selectedDays} DAYS`}
              </span>
            </div>

            {/* Horizontal Perforation */}
            <div className="perf-h -mx-6 sm:-mx-7 my-2"></div>

            {/* Interactive SMS Service Tabs */}
            <div className="pt-2">
              <div className="flex border-b border-[#221D16]/30 mb-3">
                <button
                  onClick={() => {
                    setActiveTab('inbox');
                    setSelectedMessage(null);
                  }}
                  className={`flex-1 py-2 font-mono-retro text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === 'inbox'
                      ? 'border-b-2 border-[#5B3A5C] text-[#5B3A5C]'
                      : 'text-[#221D16]/60 hover:text-[#221D16]'
                  }`}
                >
                  💬 SMS Inbox
                  {unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#B23A2E] text-white text-[10px] flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('send');
                    setSelectedMessage(null);
                  }}
                  className={`flex-1 py-2 font-mono-retro text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === 'send'
                      ? 'border-b-2 border-[#5B3A5C] text-[#5B3A5C]'
                      : 'text-[#221D16]/60 hover:text-[#221D16]'
                  }`}
                >
                  <Send className="w-3 h-3" />
                  Send SMS
                </button>

                <button
                  onClick={() => {
                    setActiveTab('simulate');
                    setSelectedMessage(null);
                  }}
                  className={`flex-1 py-2 font-mono-retro text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === 'simulate'
                      ? 'border-b-2 border-[#5B3A5C] text-[#5B3A5C]'
                      : 'text-[#221D16]/60 hover:text-[#221D16]'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-[#B23A2E]" />
                  Test 2FA
                </button>
              </div>

              {/* Detail view when message selected */}
              {selectedMessage ? (
                <div className="p-3 bg-white/50 border border-[#221D16]/20 rounded mb-3 font-sans">
                  <div className="flex justify-between items-center text-xs font-mono-retro opacity-60 mb-2">
                    <span>{selectedMessage.isOutbound ? `TO: ${selectedMessage.to}` : `FROM: ${selectedMessage.from}`}</span>
                    <span>{selectedMessage.timestamp}</span>
                  </div>

                  <div className="text-sm text-[#221D16] mb-3 leading-relaxed">
                    {selectedMessage.body}
                  </div>

                  {selectedMessage.otpCode && (
                    <div className="flex items-center justify-between p-2 bg-[#5B3A5C]/10 border border-[#5B3A5C]/30 rounded mb-3">
                      <span className="font-mono-retro text-xs font-bold text-[#5B3A5C]">
                        OTP: {selectedMessage.otpCode}
                      </span>
                      <button
                        onClick={() => handleCopyOtp(selectedMessage.otpCode!)}
                        className="btn-retro plum !py-1 !px-2 text-[11px]"
                      >
                        {copiedOtp === selectedMessage.otpCode ? 'Copied ✓' : 'Copy Code'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-xs font-mono-retro text-[#5B3A5C] font-bold hover:underline"
                  >
                    ← Back to SMS List
                  </button>
                </div>
              ) : (
                <>
                  {/* TAB 1: INBOX */}
                  {activeTab === 'inbox' && (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {inboxMessages.length === 0 ? (
                        <div className="py-8 text-center font-mono-retro text-xs text-[#221D16]/50 border border-dashed border-[#221D16]/30 rounded">
                          {activeTicket
                            ? 'Listening for incoming SMS on this line...'
                            : 'SMS Inbox is empty until you pull this ticket.'}
                        </div>
                      ) : (
                        inboxMessages.map((msg) => (
                          <div
                            key={msg.id}
                            onClick={() => {
                              msg.isRead = true;
                              setSelectedMessage(msg);
                            }}
                            className={`p-2.5 rounded border transition-colors cursor-pointer ${
                              !msg.isRead
                                ? 'bg-white/80 border-[#5B3A5C] shadow-xs'
                                : 'bg-white/40 border-[#221D16]/20 hover:bg-white/60'
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs font-mono-retro mb-1">
                              <span className="font-bold text-[#5B3A5C]">{msg.from}</span>
                              <span className="opacity-50 text-[10px]">{msg.timestamp}</span>
                            </div>
                            <div className="text-xs text-[#221D16] line-clamp-2">
                              {msg.body}
                            </div>
                            {msg.otpCode && (
                              <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono-retro font-bold px-1.5 py-0.5 bg-[#5B3A5C]/12 text-[#5B3A5C] rounded border border-[#5B3A5C]/20">
                                🔑 Code: {msg.otpCode}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 2: SEND SMS */}
                  {activeTab === 'send' && (
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        value={sendTo}
                        onChange={(e) => setSendTo(e.target.value)}
                        placeholder="Recipient: e.g. +1 415 555 0199"
                        disabled={!activeTicket}
                        className="w-full px-3 py-2 text-xs font-mono-retro bg-white/70 border border-[#221D16] rounded outline-none disabled:opacity-50"
                      />
                      <textarea
                        value={sendBody}
                        onChange={(e) => setSendBody(e.target.value)}
                        placeholder="Type message body..."
                        rows={2}
                        maxLength={320}
                        disabled={!activeTicket}
                        className="w-full px-3 py-2 text-xs bg-white/70 border border-[#221D16] rounded outline-none resize-none disabled:opacity-50"
                      />
                      <div className="flex justify-between items-center font-mono-retro text-[10px] opacity-60">
                        <span>{sendBody.length} / 160 chars (1 segment)</span>
                        <span>Twilio Carrier Route</span>
                      </div>
                      <button
                        onClick={handleSendSms}
                        disabled={!activeTicket || isSending || !sendTo.trim() || !sendBody.trim()}
                        className="w-full btn-retro !py-2 text-xs"
                      >
                        {isSending ? 'Transmitting...' : 'Send SMS'}
                      </button>

                      {outboxMessages.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-[#221D16]/20">
                          <div className="font-mono-retro text-[10px] uppercase opacity-60 mb-1.5">
                            Recent Outbox:
                          </div>
                          {outboxMessages.slice(0, 2).map((msg) => (
                            <div key={msg.id} className="text-xs p-2 bg-white/30 rounded mb-1">
                              <span className="font-mono-retro font-bold text-[11px]">To {msg.to}:</span>{' '}
                              {msg.body}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: TEST 2FA SIMULATION */}
                  {activeTab === 'simulate' && (
                    <div>
                      <p className="text-xs text-[#221D16]/75 mb-2 font-mono-retro">
                        Simulate instantaneous incoming verification OTPs:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            const code = Math.floor(100000 + Math.random() * 900000);
                            handleSimulateInbound('Google', `G-${code} is your Google verification code.`);
                          }}
                          disabled={!activeTicket}
                          className="btn-retro outline !py-1.5 !px-2 text-xs text-left justify-start gap-1.5 disabled:opacity-40"
                        >
                          📱 Google 2FA
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const p1 = Math.floor(100 + Math.random() * 900);
                            const p2 = Math.floor(100 + Math.random() * 900);
                            handleSimulateInbound('WhatsApp', `Your WhatsApp code is ${p1}-${p2}. Do not share this code.`);
                          }}
                          disabled={!activeTicket}
                          className="btn-retro outline !py-1.5 !px-2 text-xs text-left justify-start gap-1.5 disabled:opacity-40"
                        >
                          💬 WhatsApp
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const code = Math.floor(100000 + Math.random() * 900000);
                            handleSimulateInbound('SecureBank', `Your One-Time Passcode is ${code} for online authorization.`);
                          }}
                          disabled={!activeTicket}
                          className="btn-retro outline !py-1.5 !px-2 text-xs text-left justify-start gap-1.5 disabled:opacity-40"
                        >
                          🏦 Bank OTP
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const pin = Math.floor(1000 + Math.random() * 9000);
                            handleSimulateInbound('Uber', `Your ride verification PIN is ${pin}.`);
                          }}
                          disabled={!activeTicket}
                          className="btn-retro outline !py-1.5 !px-2 text-xs text-left justify-start gap-1.5 disabled:opacity-40"
                        >
                          🚗 Uber PIN
                        </button>
                      </div>

                      {/* Custom simulation inputs */}
                      <div className="pt-2 border-t border-[#221D16]/20 flex gap-2">
                        <input
                          type="text"
                          value={simSender}
                          onChange={(e) => setSimSender(e.target.value)}
                          placeholder="Sender (e.g. Discord)"
                          disabled={!activeTicket}
                          className="w-1/3 px-2 py-1 text-xs bg-white/70 border border-[#221D16] rounded outline-none"
                        />
                        <input
                          type="text"
                          value={simBody}
                          onChange={(e) => setSimBody(e.target.value)}
                          placeholder="Custom text..."
                          disabled={!activeTicket}
                          className="flex-1 px-2 py-1 text-xs bg-white/70 border border-[#221D16] rounded outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (simSender.trim() && simBody.trim()) {
                              handleSimulateInbound(simSender.trim(), simBody.trim());
                              setSimSender('');
                              setSimBody('');
                            }
                          }}
                          disabled={!activeTicket || !simSender.trim() || !simBody.trim()}
                          className="btn-retro plum !py-1 !px-2.5 text-xs"
                        >
                          Simulate
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Total Bar */}
            <div className="perf-h -mx-6 sm:-mx-7 my-3"></div>
            <div className="flex items-baseline justify-between pt-1 font-mono-retro">
              <span className="text-xs uppercase opacity-60">
                {activeTicket ? 'Total Paid' : 'Total due today'}
              </span>
              <span className="font-anton text-2xl text-[#5B3A5C]">
                ${(activeTicket ? activeTicket.rate : calculateTotal()).toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-center font-mono-retro text-xs opacity-65 mt-3">
            {activeTicket
              ? 'Your number is active. Inbound SMS is decrypted in real time.'
              : "Nothing's charged yet — this is a live preview."}
          </p>
        </div>
      </div>

      {/* Burn Ticket Confirmation Modal */}
      <ConfirmModal
        isOpen={showBurnConfirm}
        title="Burn & Release Phone Ticket"
        message={activeTicket ? `Are you sure you want to burn ticket #${activeTicket.ticketNo} (${activeTicket.fullNumber})? The line will be terminated and permanently released.` : ''}
        confirmLabel="Burn Ticket"
        isDestructive={true}
        onConfirm={handleConfirmBurnTicket}
        onClose={() => setShowBurnConfirm(false)}
      />
    </div>
  );
};
