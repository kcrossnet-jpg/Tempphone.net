import React from 'react';
import { PageView } from '../types';
import {
  AppleStoreBadge,
  GooglePlayBadge,
  RupayLogo,
  VisaLogo,
  MastercardLogo,
  AmexLogo,
  UpiLogo,
  PhonePeLogo,
  PaytmLogo,
  GooglePayLogo
} from './BrandIcons';

interface FooterProps {
  onNavigate: (page: PageView) => void;
  onOpenAuth: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenAuth
}) => {
  return (
    <footer className="bg-[#221D16] text-[#E9DEC3] pt-12 sm:pt-16 pb-8 px-4 sm:px-6 lg:px-8 mt-auto border-t-2 border-[#221D16] w-full">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10 sm:pb-12 border-b border-[#E9DEC3]/15">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-1.5 font-anton text-2xl tracking-wide text-[#E9DEC3]">
              <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span className="animate-ping-fast absolute inline-flex h-full w-full rounded-full bg-[#B23A2E] opacity-75"></span>
                <span className="animate-dot-fast relative inline-flex rounded-full h-2 w-2 bg-[#B23A2E] shadow-[0_0_8px_rgba(178,58,46,0.9)]"></span>
              </span>
              <span>TEMPPHONE</span>
            </div>
            <p className="mt-3.5 text-sm text-[#E9DEC3]/65 leading-relaxed">
              A real working number for exactly as long as you need one. Released automatically when the ticket expires.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-mono-retro text-xs uppercase tracking-widest text-[#E9DEC3]/50 mb-4 font-bold">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm text-[#E9DEC3]/80 font-medium">
              <li>
                <button
                  onClick={() => onNavigate('ticket-phone')}
                  className="hover:text-white transition-colors"
                >
                  Temporary Phone Numbers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('ticket-mail')}
                  className="hover:text-white transition-colors"
                >
                  Disposable Temp Mail
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors"
                >
                  Rates & Pricing
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono-retro text-xs uppercase tracking-widest text-[#E9DEC3]/50 mb-4 font-bold">
              Account
            </h4>
            <ul className="space-y-2.5 text-sm text-[#E9DEC3]/80 font-medium">
              <li>
                <button
                  onClick={onOpenAuth}
                  className="hover:text-white transition-colors"
                >
                  Log In / Register
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('ticket-phone')}
                  className="hover:text-white transition-colors"
                >
                  Pull a Ticket
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy-retention')}
                  className="hover:text-white transition-colors text-left"
                >
                  Privacy &amp; Retention
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono-retro text-xs uppercase tracking-widest text-[#E9DEC3]/50 mb-4 font-bold">
              Official Mobile Apps
            </h4>
            <div className="flex flex-col gap-3">
              <AppleStoreBadge href="https://apps.apple.com/app/tempphone" />
              <GooglePlayBadge href="https://play.google.com/store/apps/details?id=com.tempphone" />
            </div>
          </div>
        </div>

        {/* Real Payment Methods & Security Trust Row */}
        <div className="py-6 border-b border-[#E9DEC3]/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono-retro text-[11px] uppercase tracking-wider text-[#E9DEC3]/60 font-bold">
              Accepted Real Payments:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-white px-2 py-1 rounded shadow-xs flex items-center justify-center">
                <RupayLogo className="h-3.5" />
              </div>
              <div className="bg-white px-2 py-1 rounded shadow-xs flex items-center justify-center">
                <UpiLogo className="h-3.5" />
              </div>
              <div className="bg-white px-2 py-1 rounded shadow-xs flex items-center justify-center">
                <PhonePeLogo className="h-3.5" />
              </div>
              <div className="bg-white px-2 py-1 rounded shadow-xs flex items-center justify-center">
                <PaytmLogo className="h-3.5" />
              </div>
              <div className="bg-white px-2 py-1 rounded shadow-xs flex items-center justify-center">
                <VisaLogo className="h-3.5" />
              </div>
              <div className="bg-white px-2 py-1 rounded shadow-xs flex items-center justify-center">
                <MastercardLogo className="h-3.5" />
              </div>
              <div className="bg-white px-2 py-1 rounded shadow-xs flex items-center justify-center">
                <AmexLogo className="h-3.5" />
              </div>
              <div className="bg-white px-2 py-1 rounded shadow-xs flex items-center justify-center">
                <GooglePayLogo className="h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom banner */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-mono-retro text-[#E9DEC3]/50">
          <span>© 2026 TEMPPHONE · DISPOSABLE TELEPHONY &amp; INBOX PROTOCOL</span>
          <span>AUTO-EXPIRES · REAL SMS &amp; VOICE · ZERO SPAM</span>
        </div>
      </div>
    </footer>
  );
};
