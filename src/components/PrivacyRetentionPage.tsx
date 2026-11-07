import React from 'react';
import { PageView, UserSession } from '../types';
import {
  ShieldCheck,
  Lock,
  Clock,
  EyeOff,
  Smartphone,
  Mail,
  Scale,
  ShieldAlert,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface PrivacyRetentionPageProps {
  onNavigate: (page: PageView) => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
  session: UserSession | null;
}

export const PrivacyRetentionPage: React.FC<PrivacyRetentionPageProps> = ({
  onNavigate
}) => {
  return (
    <div className="py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-[#221D16]">
      {/* Header Breadcrumb & Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={() => onNavigate('home')}
          className="font-mono-retro text-xs font-bold text-[#5B3A5C] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>← Back to Home</span>
        </button>

        <div className="font-mono-retro text-xs font-bold text-[#B23A2E] bg-[#B23A2E]/10 border border-[#B23A2E]/30 px-3 py-1 rounded inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#B23A2E] animate-pulse"></span>
          <span>DOCUMENT NO. SEC-PRIV-2026-R4</span>
        </div>
      </div>

      {/* Main Title Hero Ticket */}
      <div className="ticket-box bg-[#DED0AC] p-4 sm:p-6 lg:p-8 mb-8 sm:mb-10 relative overflow-hidden">
        {/* Decorative Stamp */}
        <div className="hidden sm:block absolute right-6 top-6 border-2 border-[#B23A2E] text-[#B23A2E] font-mono-retro text-[11px] font-black uppercase px-3.5 py-1.5 rounded -rotate-6 tracking-wider shadow-xs pointer-events-none">
          STRICT ZERO RETENTION · VERIFIED
        </div>

        <div className="font-mono-retro text-xs uppercase tracking-widest text-[#5B3A5C] font-bold flex items-center gap-2 mb-2">
          <span className="text-[#B23A2E]">—</span> TELEPHONY &amp; INBOX DATA LIFECYCLE
        </div>

        <h1 className="font-anton text-2xl sm:text-4xl md:text-5xl text-[#221D16] uppercase leading-[0.95] tracking-tight mb-4">
          Privacy &amp; Data Retention Policy
        </h1>

        <p className="text-sm sm:text-base text-[#221D16]/85 max-w-3xl leading-relaxed">
          TempPhone is built around one governing principle: <strong>Get a number. Use it. Lose it.</strong> We treat data not as an asset to harvest or monetize, but as a liability that must automatically expire, burn, and dissolve from memory.
        </p>

        {/* Feature Pills */}
        <div className="perf-h -mx-6 sm:-mx-8 my-6"></div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono-retro">
          <div className="flex items-center gap-2 text-[#221D16]/80">
            <Clock className="w-4 h-4 text-[#5B3A5C] shrink-0" />
            <span>Automatic TTL Expiration</span>
          </div>
          <div className="flex items-center gap-2 text-[#221D16]/80">
            <Lock className="w-4 h-4 text-[#B23A2E] shrink-0" />
            <span>Zero Long-Term Logs</span>
          </div>
          <div className="flex items-center gap-2 text-[#221D16]/80">
            <EyeOff className="w-4 h-4 text-[#5B3A5C] shrink-0" />
            <span>Zero Tracking &amp; Ads</span>
          </div>
          <div className="flex items-center gap-2 text-[#221D16]/80">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>72hr Line Quarantine</span>
          </div>
        </div>
      </div>

      {/* Policy Content Sections */}
      <div className="space-y-8">
        {/* Guiding Tenets Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="ticket-box bg-[#FAF6EE] p-5">
            <div className="font-mono-retro text-xs font-bold text-[#B23A2E] mb-2 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Right to Immediate Burn</span>
            </div>
            <h3 className="font-anton text-lg uppercase text-[#221D16] mb-2">
              Instant Manual Expiration
            </h3>
            <p className="text-xs text-[#221D16]/80 leading-relaxed">
              You do not have to wait for the ticket timer to run down. At any moment, tap <strong>"Burn Ticket Now"</strong> on any active phone number or disposable mailbox to immediately vaporize all messages and release the line.
            </p>
          </div>

          <div className="ticket-box bg-[#FAF6EE] p-5">
            <div className="font-mono-retro text-xs font-bold text-[#5B3A5C] mb-2 uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>The 72-Hour Air Gap</span>
            </div>
            <h3 className="font-anton text-lg uppercase text-[#221D16] mb-2">
              Number Cooldown Quarantine
            </h3>
            <p className="text-xs text-[#221D16]/80 leading-relaxed">
              When your ticket expires, the phone number does not immediately go to the next user. It is placed into a mandatory <strong>72-hour silent quarantine</strong>. Any stray messages or calls arriving during quarantine are rejected.
            </p>
          </div>

          <div className="ticket-box bg-[#FAF6EE] p-5">
            <div className="font-mono-retro text-xs font-bold text-emerald-800 mb-2 uppercase flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              <span>Zero Tracking Dossiers</span>
            </div>
            <h3 className="font-anton text-lg uppercase text-[#221D16] mb-2">
              No Analytics or Ad Pixels
            </h3>
            <p className="text-xs text-[#221D16]/80 leading-relaxed">
              We do not include third-party tracking scripts, social media tracking pixels, or advertising beacons. Our operations are funded strictly by prepaid transparent ticket fees.
            </p>
          </div>
        </div>

        {/* Regulatory & Telephony Standards */}
        <div className="bg-white/85 border-2 border-[#221D16] rounded-lg p-6 sm:p-8 shadow-[4px_4px_0_rgba(34,29,22,0.12)] space-y-6">
          <div>
            <div className="flex items-center gap-2 font-mono-retro text-xs font-bold uppercase text-[#5B3A5C] mb-1">
              <Scale className="w-4 h-4" />
              <span>Legal &amp; Telecommunications Framework</span>
            </div>
            <h2 className="font-anton text-2xl uppercase tracking-wide text-[#221D16]">
              Regulatory Compliance &amp; Acceptable Telephony Usage
            </h2>
            <p className="text-sm text-[#221D16]/80 mt-1 leading-relaxed">
              TempPhone operates within international telecommunications frameworks while championing individual privacy rights.
            </p>
          </div>

          <div className="space-y-5 text-xs sm:text-sm text-[#221D16]/85 leading-relaxed">
            <div className="border-l-3 border-[#5B3A5C] pl-4 py-1">
              <h3 className="font-bold text-[#221D16] text-sm mb-1 font-mono-retro flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#5B3A5C]" />
                <span>A. GDPR Article 17 ("Right to Erasure") by Architecture</span>
              </h3>
              <p>
                Because TempPhone does not retain permanent data records, we satisfy GDPR Article 17 by design. Your temporary phone tickets and disposable email inboxes automatically expire and self-erase without requiring manual support tickets or data deletion requests.
              </p>
            </div>

            <div className="border-l-3 border-[#B23A2E] pl-4 py-1">
              <h3 className="font-bold text-[#221D16] text-sm mb-1 font-mono-retro flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#B23A2E]" />
                <span>B. Anti-Abuse &amp; Telecom Anti-Fraud Enforcement</span>
              </h3>
              <p>
                TempPhone strictly prohibits the use of disposable numbers for illegal harassment, automated robocalling, phishing campaigns, financial scams, or evasion of lawful subpoenas. We employ automated heuristics that immediately terminate lines engaged in abusive inbound message patterns.
              </p>
            </div>

            <div className="border-l-3 border-[#5B3A5C] pl-4 py-1">
              <h3 className="font-bold text-[#221D16] text-sm mb-1 font-mono-retro flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#5B3A5C]" />
                <span>C. Payment Privacy &amp; Secure Tokenization</span>
              </h3>
              <p>
                All payments are processed directly by certified banking partners and payment gateways (such as Razorpay, UPI, Apple Pay, Google Pay). TempPhone does not capture, store, or transmit raw credit card numbers or UPI PINs. We store only anonymized transaction references for receipt generation.
              </p>
            </div>

            <div className="border-l-3 border-emerald-700 pl-4 py-1">
              <h3 className="font-bold text-[#221D16] text-sm mb-1 font-mono-retro flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>D. Non-Sale Guarantee</span>
              </h3>
              <p>
                TempPhone will never sell, rent, license, or monetize any user email, phone number, SMS body, or verification record to third-party data brokers, marketing networks, or advertiser exchanges.
              </p>
            </div>
          </div>

          {/* Questions Contact */}
          <div className="p-4 bg-[#FAF6EE] border border-[#221D16]/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mt-6">
            <div>
              <span className="font-bold font-mono-retro text-[#221D16] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#5B3A5C]" />
                <span>Questions or Data Privacy Inquiries:</span>
              </span>
              <p className="text-[#221D16]/70 mt-0.5">
                Reach our Data Protection desk directly at{' '}
                <a href="mailto:privacy@tempphone.in" className="font-mono-retro text-[#5B3A5C] font-bold hover:underline">
                  privacy@tempphone.in
                </a>
              </p>
            </div>

            <a
              href="mailto:privacy@tempphone.in"
              className="btn-retro outline !py-1.5 !px-3 text-xs shrink-0"
            >
              Email Privacy Desk
            </a>
          </div>
        </div>
      </div>

      {/* Bottom CTA to get back to renting */}
      <div className="mt-12 ticket-box bg-[#5B3A5C] text-[#E9DEC3] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-mono-retro text-xs font-bold text-[#DED0AC] uppercase tracking-widest mb-1">
            — DISPOSABLE PRIVACY IN PRACTICE
          </div>
          <h2 className="font-anton text-2xl sm:text-3xl uppercase tracking-tight text-[#E9DEC3]">
            Ready to pull a clean number?
          </h2>
          <p className="text-xs sm:text-sm text-[#E9DEC3]/80 mt-1 max-w-xl">
            Choose your country, get your number on the spot, receive your verification code, and let it expire on its own.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('ticket-phone')}
            className="btn-retro !bg-[#E9DEC3] !text-[#221D16] !border-[#221D16] text-xs font-bold !py-2.5 !px-4 flex items-center gap-2 shadow-[3px_3px_0_#221D16]"
          >
            <Smartphone className="w-4 h-4 text-[#5B3A5C]" />
            <span>Pull Phone Ticket</span>
          </button>
          <button
            onClick={() => onNavigate('ticket-mail')}
            className="btn-retro outline !border-[#E9DEC3] !text-[#E9DEC3] text-xs font-bold !py-2.5 !px-4 flex items-center gap-2 hover:!bg-[#E9DEC3]/10"
          >
            <Mail className="w-4 h-4" />
            <span>Disposable Mail</span>
          </button>
        </div>
      </div>
    </div>
  );
};
