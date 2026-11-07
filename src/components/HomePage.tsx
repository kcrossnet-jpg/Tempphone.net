import React from 'react';
import { PageView } from '../types';
import { Smartphone, Mail, ArrowRight, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import {
  AppleStoreBadge,
  GooglePlayBadge
} from './BrandIcons';

interface HomePageProps {
  onNavigate: (page: PageView) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="pt-10 sm:pt-16 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-7">
            <div className="font-mono-retro text-xs uppercase tracking-widest text-[#5B3A5C] font-bold flex items-center gap-2 mb-3 sm:mb-4">
              <span className="text-[#B23A2E]">—</span> NUMBERS ISSUED ON THE SPOT
            </div>

            <h1 className="font-anton text-3xl sm:text-5xl md:text-6xl text-[#221D16] uppercase leading-[0.95] tracking-tight">
              Get a number.
              <span className="block text-[#B23A2E] drop-shadow-[2px_2px_0_#221D16]">
                Use it. Lose it.
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[#221D16]/85 max-w-xl leading-relaxed">
              Rent a real, working phone number for as long as you need it — a day, a week, a month — and let it expire on its own. No contract to cancel, nothing to remember.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <button
                onClick={() => onNavigate('ticket-phone')}
                className="btn-retro plum text-sm sm:text-base !py-3 !px-6 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <span>Pull a ticket</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('ticket-mail')}
                className="btn-retro outline text-sm sm:text-base !py-3 !px-6 flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Mail className="w-4 h-4 text-[#5B3A5C]" />
                <span>Try Temp Mail</span>
              </button>
            </div>

            <div className="font-mono-retro text-xs opacity-75 mt-5">
              From $0.50/day · Real SMS &amp; calls included · Cancel by doing nothing
            </div>

            {/* Mobile badges */}
            <div className="mt-8 pt-6 border-t border-[#221D16]/15">
              <p className="font-mono-retro text-xs uppercase tracking-wider opacity-70 mb-3 font-bold">
                Also available on mobile:
              </p>
              <div className="flex flex-wrap gap-3">
                <AppleStoreBadge href="https://apps.apple.com/app/tempphone" />
                <GooglePlayBadge href="https://play.google.com/store/apps/details?id=com.tempphone" />
              </div>
            </div>
          </div>

          {/* Right Ticket Illustration */}
          <div className="lg:col-span-5 w-full">
            <div className="ticket-box p-5 sm:p-7 bg-[#DED0AC] rotate-0 sm:rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="flex justify-between items-start pb-4">
                <div className="font-mono-retro text-xs tracking-wider opacity-65 font-bold">
                  TICKET NO. 004821
                </div>
                <div className="font-mono-retro text-xs font-bold bg-[#B23A2E] text-[#E9DEC3] px-2.5 py-1 rounded -rotate-3">
                  ACTIVE
                </div>
              </div>

              <div className="font-mono-retro font-bold text-xl sm:text-2xl md:text-3xl py-2 text-[#221D16] tracking-tight truncate">
                +1 (415) ***-****
              </div>

              <div className="flex justify-between font-mono-retro text-xs opacity-75 pb-4">
                <span>ISSUED: JUL 02</span>
                <span className="text-[#5B3A5C] font-bold">EXPIRES: JUL 09</span>
              </div>

              {/* Simulated SMS card inside ticket */}
              <div className="bg-white/60 border border-dashed border-[#221D16]/30 rounded p-3 text-xs mb-3">
                <div className="font-mono-retro font-bold text-[11px] text-[#5B3A5C] mb-1">
                  FROM: DELIVERY-CO
                </div>
                <div className="break-words">Your verification code is 481203. Expires in 10 min.</div>
              </div>

              <div className="perf-h -mx-5 sm:-mx-7 my-2"></div>

              <div className="flex flex-wrap justify-between items-center gap-1 font-mono-retro text-xs opacity-70 pt-2">
                <span>AREA CODE 415 (SAN FRANCISCO)</span>
                <span className="font-bold">7-DAY PASS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Tape */}
      <div className="bg-[#221D16] text-[#E9DEC3] py-3.5 overflow-hidden border-y-2 border-[#221D16]">
        <div className="animate-marquee font-mono-retro text-xs sm:text-sm tracking-widest font-bold">
          <span className="mx-6">NO CONTRACTS</span>
          <span className="text-[#B23A2E]">◆</span>
          <span className="mx-6">REAL SMS &amp; VOICE</span>
          <span className="text-[#B23A2E]">◆</span>
          <span className="mx-6">AUTO-EXPIRES</span>
          <span className="text-[#B23A2E]">◆</span>
          <span className="mx-6">15+ COUNTRIES</span>
          <span className="text-[#B23A2E]">◆</span>
          <span className="mx-6">FROM $0.50/DAY</span>
          <span className="text-[#B23A2E]">◆</span>
          <span className="mx-6">NO CONTRACTS</span>
          <span className="text-[#B23A2E]">◆</span>
          <span className="mx-6">REAL SMS &amp; VOICE</span>
          <span className="text-[#B23A2E]">◆</span>
          <span className="mx-6">AUTO-EXPIRES</span>
          <span className="text-[#B23A2E]">◆</span>
          <span className="mx-6">15+ COUNTRIES</span>
          <span className="text-[#B23A2E]">◆</span>
          <span className="mx-6">FROM $0.50/DAY</span>
        </div>
      </div>

      {/* How it works */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="max-w-xl mb-12">
          <div className="font-mono-retro text-xs uppercase tracking-widest text-[#5B3A5C] font-bold flex items-center gap-2 mb-2">
            <span className="text-[#B23A2E]">—</span> THE PROCESS
          </div>
          <h2 className="font-anton text-3xl sm:text-4xl uppercase text-[#221D16]">
            Three tickets, one number
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#221D16]/80 leading-relaxed">
            No paperwork or complex verification. Choose a country and city code, lease the line, and let it return to the pool when the timer runs out.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-2 border-[#221D16] rounded-lg overflow-hidden bg-[#DED0AC] shadow-[6px_6px_0_rgba(34,29,22,0.14)]">
          <div className="p-8 border-b md:border-b-0 md:border-r-2 border-dashed border-[#221D16]/30">
            <span className="font-mono-retro font-bold text-xs text-[#B23A2E] tracking-wider mb-3 block">
              01 / PICK
            </span>
            <h3 className="font-anton text-xl uppercase mb-2 text-[#221D16]">
              Choose a country &amp; code
            </h3>
            <p className="text-sm text-[#221D16]/80 leading-relaxed">
              Search by country and local city code across 15+ nations. If nothing is in stock, fresh lines are provisioned in under 5 seconds.
            </p>
          </div>

          <div className="p-8 border-b md:border-b-0 md:border-r-2 border-dashed border-[#221D16]/30">
            <span className="font-mono-retro font-bold text-xs text-[#B23A2E] tracking-wider mb-3 block">
              02 / RENT
            </span>
            <h3 className="font-anton text-xl uppercase mb-2 text-[#221D16]">
              Set the duration
            </h3>
            <p className="text-sm text-[#221D16]/80 leading-relaxed">
              One day, one week, or one month — pay only for the active duration. Your ticket displays the precise expiry timestamp.
            </p>
          </div>

          <div className="p-8">
            <span className="font-mono-retro font-bold text-xs text-[#B23A2E] tracking-wider mb-3 block">
              03 / RELEASE
            </span>
            <h3 className="font-anton text-xl uppercase mb-2 text-[#221D16]">
              Let it expire
            </h3>
            <p className="text-sm text-[#221D16]/80 leading-relaxed">
              Inbound SMS messages decrypt live in your ticket console. When the clock runs out, all records are permanently flushed.
            </p>
          </div>
        </div>
      </section>

      {/* Rates Table Section */}
      <section className="py-20 px-6 bg-[#DED0AC] border-y border-[#221D16]/20">
        <div className="max-w-6xl mx-auto w-full">
          <div className="max-w-xl mb-12">
            <div className="font-mono-retro text-xs uppercase tracking-widest text-[#5B3A5C] font-bold flex items-center gap-2 mb-2">
              <span className="text-[#B23A2E]">—</span> RATES &amp; TIERS
            </div>
            <h2 className="font-anton text-3xl sm:text-4xl uppercase text-[#221D16]">
              One rate. Book by the day.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#221D16]/80 leading-relaxed">
              Every ticket includes inbound SMS and voice routing. No hidden carrier fees or renewal traps.
            </p>
          </div>

          {/* Ticket Book Table */}
          <div className="ticket-box bg-[#E9DEC3] overflow-hidden">
            <div className="hidden md:grid grid-cols-12 items-center p-4 px-6 font-mono-retro text-xs uppercase tracking-wider opacity-60 border-b border-[#221D16]/20">
              <span className="col-span-4">Duration</span>
              <span className="col-span-2">Daily Rate</span>
              <span className="col-span-2">Total</span>
              <span className="col-span-2">Included</span>
              <span className="col-span-2 text-right">Action</span>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-12 items-center p-5 px-6 gap-3 border-b border-dashed border-[#221D16]/25 hover:bg-[#DED0AC]/50 transition-colors">
              <div className="col-span-4">
                <div className="font-anton text-lg uppercase text-[#221D16]">Day Pass</div>
                <div className="text-xs text-[#221D16]/70">Ideal for one-time verification or single sign-up</div>
              </div>
              <div className="col-span-2 font-mono-retro font-bold text-sm text-[#221D16]">$0.50/day</div>
              <div className="col-span-2 font-mono-retro font-bold text-base text-[#5B3A5C]">$0.50</div>
              <div className="col-span-2">
                <span className="font-mono-retro text-xs px-2.5 py-0.5 border border-[#5B3A5C] text-[#5B3A5C] rounded-full font-bold">
                  SMS + Voice
                </span>
              </div>
              <div className="col-span-2 text-left md:text-right">
                <button
                  onClick={() => onNavigate('ticket-phone')}
                  className="btn-retro outline !py-1.5 !px-3.5 text-xs"
                >
                  Take it
                </button>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-12 items-center p-5 px-6 gap-3 border-b border-dashed border-[#221D16]/25 hover:bg-[#DED0AC]/50 transition-colors">
              <div className="col-span-4">
                <div className="font-anton text-lg uppercase text-[#221D16]">Week Pass</div>
                <div className="text-xs text-[#221D16]/70">For marketplace listings, short travel, or trials</div>
              </div>
              <div className="col-span-2 font-mono-retro font-bold text-sm text-[#221D16]">$0.50/day</div>
              <div className="col-span-2 font-mono-retro font-bold text-base text-[#5B3A5C]">$3.50</div>
              <div className="col-span-2">
                <span className="font-mono-retro text-xs px-2.5 py-0.5 bg-[#5B3A5C] text-[#E9DEC3] rounded-full font-bold">
                  Most Popular
                </span>
              </div>
              <div className="col-span-2 text-left md:text-right">
                <button
                  onClick={() => onNavigate('ticket-phone')}
                  className="btn-retro plum !py-1.5 !px-3.5 text-xs"
                >
                  Take it
                </button>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-12 items-center p-5 px-6 gap-3 hover:bg-[#DED0AC]/50 transition-colors">
              <div className="col-span-4">
                <div className="font-anton text-lg uppercase text-[#221D16]">Month Pass</div>
                <div className="text-xs text-[#221D16]/70">For ongoing freelancing, QA test suites, or privacy</div>
              </div>
              <div className="col-span-2 font-mono-retro font-bold text-sm text-[#221D16]">$0.50/day</div>
              <div className="col-span-2 font-mono-retro font-bold text-base text-[#5B3A5C]">$15.00</div>
              <div className="col-span-2">
                <span className="font-mono-retro text-xs px-2.5 py-0.5 border border-[#5B3A5C] text-[#5B3A5C] rounded-full font-bold">
                  SMS + Voice
                </span>
              </div>
              <div className="col-span-2 text-left md:text-right">
                <button
                  onClick={() => onNavigate('ticket-phone')}
                  className="btn-retro outline !py-1.5 !px-3.5 text-xs"
                >
                  Take it
                </button>
              </div>
            </div>
          </div>

          {/* Security & Privacy note */}
          <div className="mt-4 p-3 bg-white/50 border-1.5 border-[#221D16]/20 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono-retro">
            <div className="flex items-center gap-2 text-[#221D16]/80">
              <ShieldCheck className="w-4 h-4 text-[#5B3A5C]" />
              <span>Real carrier lines • Automatic disposal • Zero logs retained</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('privacy-retention')}
                className="text-[11px] text-[#221D16]/75 hover:text-[#5B3A5C] font-bold underline cursor-pointer"
              >
                Read Privacy &amp; Retention
              </button>
              <button
                type="button"
                onClick={() => onNavigate('ticket-phone')}
                className="flex items-center gap-1.5 text-[11px] text-[#5B3A5C] font-bold hover:underline cursor-pointer"
              >
                <span>Explore Numbers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="max-w-xl mb-8 sm:mb-10">
          <div className="font-mono-retro text-xs uppercase tracking-widest text-[#5B3A5C] font-bold flex items-center gap-2 mb-2">
            <span className="text-[#B23A2E]">—</span> COMMON SCENARIOS
          </div>
          <h2 className="font-anton text-2xl sm:text-3xl md:text-4xl uppercase text-[#221D16]">
            Built for the "just this once" number
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#221D16]/80">
            Anywhere a form asks for a phone number or email address that doesn't need your real identity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          {[
            { label: 'Online Sign-ups & Trials', rot: '-rotate-1' },
            { label: 'Craigslist & Marketplace Listings', rot: 'rotate-1' },
            { label: 'International Roaming Travel', rot: '-rotate-2' },
            { label: 'QA & Mobile Testing Suites', rot: 'rotate-2' },
            { label: 'Two-Factor (2FA) Codes', rot: '-rotate-1' },
            { label: 'Freelance & Client Inquiries', rot: 'rotate-1' },
            { label: 'Event RSVPs & Registrations', rot: '-rotate-2' },
            { label: 'Customer Support Test Lines', rot: 'rotate-1' }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#DED0AC] border-1.5 sm:border-2 border-[#221D16] rounded-full font-mono-retro text-xs sm:text-sm font-bold text-[#221D16] shadow-[2px_2px_0_rgba(34,29,22,0.12)] sm:shadow-[3px_3px_0_rgba(34,29,22,0.12)] hover:bg-[#B23A2E] hover:text-[#E9DEC3] hover:border-[#B23A2E] transition-all cursor-default ${item.rot}`}
            >
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* Stats Ribbon */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full pb-12 sm:pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 border-2 border-[#221D16] rounded-lg overflow-hidden bg-[#DED0AC] shadow-[4px_4px_0_rgba(34,29,22,0.14)] sm:shadow-[6px_6px_0_rgba(34,29,22,0.14)]">
          <div className="p-4 sm:p-6 text-center border-r border-b lg:border-b-0 border-dashed border-[#221D16]/30">
            <div className="font-anton text-2xl sm:text-3xl md:text-4xl text-[#5B3A5C]">15+</div>
            <div className="font-mono-retro text-[11px] sm:text-xs uppercase tracking-wider opacity-70 mt-1">
              Countries Covered
            </div>
          </div>

          <div className="p-4 sm:p-6 text-center border-b lg:border-b-0 lg:border-r border-dashed border-[#221D16]/30">
            <div className="font-anton text-2xl sm:text-3xl md:text-4xl text-[#5B3A5C]">&lt;5s</div>
            <div className="font-mono-retro text-[11px] sm:text-xs uppercase tracking-wider opacity-70 mt-1">
              Provisioning Speed
            </div>
          </div>

          <div className="p-4 sm:p-6 text-center border-r border-dashed border-[#221D16]/30">
            <div className="font-anton text-2xl sm:text-3xl md:text-4xl text-[#5B3A5C]">$0.50</div>
            <div className="font-mono-retro text-[11px] sm:text-xs uppercase tracking-wider opacity-70 mt-1">
              Flat Daily Price
            </div>
          </div>

          <div className="p-4 sm:p-6 text-center">
            <div className="font-anton text-2xl sm:text-3xl md:text-4xl text-[#5B3A5C]">0</div>
            <div className="font-mono-retro text-[11px] sm:text-xs uppercase tracking-wider opacity-70 mt-1">
              Contracts to Cancel
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Download Callout */}
      <section className="bg-gradient-to-br from-[#5B3A5C] to-[#432A44] text-[#E9DEC3] py-16 px-6 border-t-2 border-[#221D16]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <div className="font-mono-retro text-xs font-bold uppercase tracking-widest text-[#E9DEC3]/80 flex items-center gap-2 mb-3">
              <span>—</span> TAKE IT WITH YOU
            </div>

            <h2 className="font-anton text-3xl sm:text-4xl uppercase tracking-tight text-[#E9DEC3] mb-4">
              Download our mobile app
            </h2>

            <p className="text-base text-[#E9DEC3]/90 leading-relaxed mb-6">
              Pull tickets, receive texts, and manage your temporary numbers on the go. Available for iOS and Android with all features and offline ticket access.
            </p>

            <div className="flex flex-wrap gap-4 mb-6">
              <AppleStoreBadge href="https://apps.apple.com/app/tempphone" />
              <GooglePlayBadge href="https://play.google.com/store/apps/details?id=com.tempphone" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono-retro text-xs opacity-85">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E9DEC3]" /> 100% web parity
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E9DEC3]" /> Push SMS alerts
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E9DEC3]" /> Offline stubs
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
