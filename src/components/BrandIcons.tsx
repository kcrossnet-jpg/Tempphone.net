import React from 'react';

// --- SITE BRAND LOGO ---
export const AppLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="geometricPrecision"
    textRendering="geometricPrecision"
    className={`inline-block shrink-0 img-retina ${className}`}
  >
    {/* Retro Ticket / Phone Badge Base */}
    <rect x="4" y="4" width="40" height="40" rx="10" fill="#221D16" />
    <rect x="6" y="6" width="36" height="36" rx="8" fill="#5B3A5C" />
    {/* Inner ticket border with subtle perforation cutouts */}
    <rect x="9" y="9" width="30" height="30" rx="5" fill="#E9DEC3" stroke="#221D16" strokeWidth="1.5" strokeDasharray="3 2" />
    
    {/* Telephone Handset Silhouette */}
    <path
      d="M18 16c-.5 0-1 .2-1.4.6l-1.5 1.5c-.7.7-.9 1.8-.4 2.7 1.8 3.5 4.6 6.3 8.1 8.1.9.5 2 .3 2.7-.4l1.5-1.5c.8-.8.8-2 0-2.8l-2.4-2.4c-.8-.8-2-.8-2.8 0l-.6.6c-1.4-.8-2.5-1.9-3.3-3.3l.6-.6c.8-.8.8-2 0-2.8l-2.4-2.4c-.4-.4-.9-.6-1.4-.6z"
      fill="#B23A2E"
    />
    
    {/* Active Signal Waves */}
    <path
      d="M28 15c2.2 1.3 3.8 3.5 4.3 6"
      stroke="#5B3A5C"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M31 12c3.4 2.1 5.8 5.7 6.4 9.6"
      stroke="#B23A2E"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// --- APPLE APP STORE BADGE (OFFICIAL SPEC) ---
export const AppleStoreBadge: React.FC<{
  className?: string;
  onClick?: () => void;
  href?: string;
}> = ({ className = '', onClick, href }) => {
  const content = (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2.5 bg-black text-white rounded-xl border-1.5 border-white/20 hover:border-white/40 shadow-[3px_3px_0_rgba(0,0,0,0.4)] hover:shadow-[4px_4px_0_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all select-none cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Official Apple Logo SVG */}
      <svg className="w-6 h-6 shrink-0 fill-current" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.16.65-2.84 1.45-.6.69-1.12 1.77-1.05 2.84 1.08.08 2.2-.64 2.88-1.42z" />
      </svg>
      <div className="text-left leading-tight">
        <div className="text-[10px] uppercase font-sans tracking-wide opacity-80">
          Download on the
        </div>
        <div className="text-base font-bold font-sans tracking-tight">
          App Store
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
        {content}
      </a>
    );
  }
  return content;
};

// --- GOOGLE PLAY STORE BADGE (OFFICIAL SPEC) ---
export const GooglePlayBadge: React.FC<{
  className?: string;
  onClick?: () => void;
  href?: string;
}> = ({ className = '', onClick, href }) => {
  const content = (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2.5 bg-black text-white rounded-xl border-1.5 border-white/20 hover:border-white/40 shadow-[3px_3px_0_rgba(0,0,0,0.4)] hover:shadow-[4px_4px_0_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all select-none cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Official Multicolor Google Play Triangular Logo */}
      <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
        {/* Blue / Cyan left facet */}
        <path
          d="M3.6 1.8c-.4.4-.6 1.1-.6 2v16.4c0 .9.2 1.6.6 2l.1.1 9.2-9.2v-.2L3.7 1.7l-.1.1z"
          fill="#00E5FF"
        />
        {/* Green top facet */}
        <path
          d="M16 8.9L12.9 12 3.6 2.7c.3-.3.9-.4 1.5 0l10.9 6.2z"
          fill="#00E676"
        />
        {/* Yellow bottom facet */}
        <path
          d="M16 15.1L4.1 21.9c-.6.3-1.2.3-1.5 0L12.9 12l3.1 3.1z"
          fill="#FFD600"
        />
        {/* Red right triangle */}
        <path
          d="M15.9 15.9l-3-3v-.2l3-3 .1.1 3.5 2c1 .6 1 1.5 0 2.1l-3.6 2z"
          fill="#FF3D00"
        />
      </svg>
      <div className="text-left leading-tight">
        <div className="text-[9px] uppercase font-sans tracking-wider opacity-80">
          GET IT ON
        </div>
        <div className="text-base font-bold font-sans tracking-tight">
          Google Play
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
        {content}
      </a>
    );
  }
  return content;
};

// --- REAL PAYMENT ICONS ---

// Official Visa Logo
export const VisaLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 64 20" className={`inline-block ${className}`} fill="none">
    <path
      d="M25.7 19.3l3.6-18.6h5.8l-3.6 18.6h-5.8zm22.4-18.1c-1.2-.5-3-.8-5.3-.8-5.8 0-9.9 3.1-10 7.5-.1 3.3 3 5.1 5.2 6.2 2.3 1.1 3.1 1.8 3.1 2.8 0 1.5-1.8 2.2-3.5 2.2-2.3 0-3.6-.3-5.5-1.2l-.8-.4-.8 4.4c1.3.6 3.7 1.1 6.2 1.1 5.9 0 9.7-2.9 9.8-7.4 0-2.5-1.5-4.4-4.8-5.9-2-.9-3.2-1.6-3.2-2.6 0-.9 1-1.8 3.2-1.8 1.8 0 3.1.4 4.1.8l.5.2.7-4.1zm15.4-.5h-4.5c-1.4 0-2.5.4-3.1 1.8l-8.8 16.8h6.1l1.2-3.4h7.5l.7 3.4h5.4l-4.5-18.6zm-7.1 11.2l2.3-6.2 1.3 6.2h-3.6zM18.8 1.2L13.2 14c-.6-1.5-2.2-4.1-4.2-5.7L14 1.2h4.8zm-11.6 0H.6L0 4.1c4.8 1.2 8 4.2 9.3 7.7L7.2 1.2z"
      fill="#1A1F71"
    />
    {/* Yellow/Gold tick for Visa Accent */}
    <path d="M9.3 11.8L7.2 1.2H2.5L2 3.6c4.2 1.1 7.2 3.8 8.4 7.2l-1.1 1z" fill="#F7B600" />
  </svg>
);

// Official Mastercard Logo
export const MastercardLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 38 24" className={`inline-block ${className}`}>
    {/* Red Circle */}
    <circle cx="12" cy="12" r="10" fill="#EB001B" />
    {/* Orange-Yellow Circle */}
    <circle cx="26" cy="12" r="10" fill="#F79E1B" fillOpacity="0.95" />
    {/* Interlocking overlap */}
    <path
      d="M19 4.3a9.98 9.98 0 0 0-3.9 7.7c0 3.2 1.5 6 3.9 7.7a9.98 9.98 0 0 0 3.9-7.7c0-3.2-1.5-6-3.9-7.7z"
      fill="#FF5F00"
    />
  </svg>
);

// Official American Express Logo
export const AmexLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 32 20" className={`inline-block ${className}`} fill="none">
    <rect width="32" height="20" rx="3" fill="#006FCF" />
    <path
      d="M6 14.5l2.2-5.4h1.7l2.2 5.4h-1.5l-.4-1.2H7.9l-.4 1.2H6zm2.3-2.3h1.5L9.1 9.9l-.8 2.3zm5.7 2.3V9.1h2.2l1.6 3.7 1.6-3.7h2.2v5.4h-1.4v-3.7l-1.6 3.7h-1.6l-1.6-3.7v3.7H14zm8.6 0V9.1h4.6v1.2h-3.2v.9h3v1.2h-3v1h3.2v1.1h-4.6z"
      fill="#FFFFFF"
    />
  </svg>
);

// Official Apple Pay Logo
export const ApplePayLogo: React.FC<{ className?: string; dark?: boolean }> = ({ className = 'h-5', dark = false }) => (
  <div className={`inline-flex items-center gap-1.5 font-sans font-semibold tracking-tight ${dark ? 'text-black' : 'text-current'} ${className}`}>
    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.16.65-2.84 1.45-.6.69-1.12 1.77-1.05 2.84 1.08.08 2.2-.64 2.88-1.42z" />
    </svg>
    <span className="text-sm tracking-normal font-bold">Pay</span>
  </div>
);

// Official Google Pay Logo
export const GooglePayLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <div className={`inline-flex items-center gap-1 font-sans ${className}`}>
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
    <span className="text-sm font-bold text-[#5f6368] tracking-tight">Pay</span>
  </div>
);

// Official PayPal Logo
export const PayPalLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 70 20" className={`inline-block ${className}`} fill="none">
    {/* PayPal Dual-P Icon */}
    <path
      d="M7.7 3.2h5.5c2.6 0 4.4 1.7 4 4.2-.5 3.1-2.9 4.8-5.5 4.8H9.3l-1.3 7.3H4.5L7.7 3.2z"
      fill="#003087"
    />
    <path
      d="M11.8 6.5h4.6c2.4 0 4.1 1.5 3.7 3.8-.5 2.8-2.6 4.3-5 4.3h-2.1l-1.1 6.1H8.5l3.3-14.2z"
      fill="#0079C1"
    />
    {/* PayPal Wordmark */}
    <text x="25" y="16" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="15" fill="#003087" fontStyle="italic">
      Pay
    </text>
    <text x="50" y="16" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="15" fill="#0079C1" fontStyle="italic">
      Pal
    </text>
  </svg>
);

// Official UPI (Unified Payments Interface) Logo
export const UpiLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 54 20" className={`inline-block ${className}`} fill="none">
    {/* Green & Orange Triangles / Chevrons */}
    <path d="M12 2L4 18h6l4-8-2-8z" fill="#097939" />
    <path d="M18 2l-4 8 2 8h6l8-16h-12z" fill="#ED752E" />
    <text x="32" y="16" fontFamily="Space Mono, monospace" fontWeight="700" fontSize="14" fill="#097939">
      UPI
    </text>
  </svg>
);

// Official Bitcoin Logo
export const BitcoinLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 24 24" className={`inline-block ${className}`}>
    <circle cx="12" cy="12" r="12" fill="#F7931A" />
    <path
      d="M16.8 10.3c.2-1.6-1-2.5-2.7-3.1l.6-2.2-1.3-.3-.5 2.1c-.4-.1-.7-.2-1.1-.3l.5-2.1-1.3-.3-.6 2.2c-.3-.1-.6-.1-.8-.2l-1.8-.4-.4 1.4s1 .2.9.2c.5.1.6.5.6.8l-.6 2.5c0 0 .1 0 .2 0h-.2l-.9 3.6c-.1.2-.3.5-.8.4 0 0-.9-.2-.9-.2l-.7 1.6 1.7.4c.3.1.6.2.9.2l-.6 2.3 1.3.3.6-2.2c.4.1.7.2 1.1.3l-.6 2.2 1.3.3.6-2.3c2.3.4 4 .2 4.7-1.8.6-1.6 0-2.5-1.1-3.1.8-.5 1.4-1.1 1.2-2.3zm-2.2 4.7c-.4 1.7-3.2.8-4.1.6l.7-2.9c.9.2 3.8.7 3.4 2.3zm.4-4.8c-.4 1.5-2.7.7-3.5.5l.7-2.6c.8.2 3.2.6 2.8 2.1z"
      fill="#FFFFFF"
    />
  </svg>
);

// Official Tether (USDT) Logo
export const UsdtLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 24 24" className={`inline-block ${className}`}>
    <circle cx="12" cy="12" r="12" fill="#26A17B" />
    <path
      d="M13.4 12.3c-.1 0-1.5.1-1.5.1s-1.4-.1-1.5-.1c-2.4-.1-4.2-.5-4.2-1 0-.6 1.8-1 4.2-1.1.1 0 1.5.1 1.5.1s1.4-.1 1.5-.1c2.4.1 4.2.5 4.2 1 0 .5-1.8.9-4.2 1zm0-2.4V8.4h4.1V6.2H6.4v2.2h4.1v1.5c-2.8.1-5 .7-5 1.4 0 .7 2.2 1.3 5 1.4v4.9h2.8v-4.9c2.8-.1 5-.7 5-1.4 0-.7-2.2-1.3-4.9-1.4z"
      fill="#FFFFFF"
    />
  </svg>
);

// Official Ethereum Logo
export const EthereumLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 24 24" className={`inline-block ${className}`}>
    <circle cx="12" cy="12" r="12" fill="#627EEA" />
    <path d="M12 3l-5 8.3L12 14l5-2.7L12 3z" fill="#FFFFFF" fillOpacity="0.6" />
    <path d="M12 3v11l5-2.7L12 3z" fill="#FFFFFF" />
    <path d="M12 15l-5-2.8L12 21l5-8.8-5 2.8z" fill="#FFFFFF" fillOpacity="0.6" />
    <path d="M12 15v6l5-8.8-5 2.8z" fill="#FFFFFF" />
  </svg>
);

// --- OFFICIAL RAZORPAY BRAND COMPONENTS ---

// Official Razorpay Wordmark & Bolt Logo
export const RazorpayLogo: React.FC<{ className?: string; light?: boolean }> = ({ className = 'h-5', light = false }) => (
  <div className={`inline-flex items-center gap-1.5 font-sans select-none ${className}`}>
    {/* Razorpay Iconic Razor Bolt Emblem */}
    <svg viewBox="0 0 28 32" className="h-6 w-auto shrink-0" fill="none">
      <path
        d="M22.4 0H5.6L0 12.8h11.2L5.6 32l22.4-19.2H16.8L22.4 0z"
        fill="#02042B"
      />
      <path
        d="M17.6 0H5.6L0 12.8h11.2L5.6 32l16.8-14.4h-9.6L17.6 0z"
        fill="#3395FF"
      />
    </svg>
    <div className="flex flex-col leading-none">
      <span className={`font-black tracking-tight text-lg ${light ? 'text-white' : 'text-[#0C2340]'}`}>
        Razorpay
      </span>
    </div>
  </div>
);

// Official Secured by Razorpay Trust Seal
export const RazorpayBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0C2340] text-white text-[10px] font-mono-retro font-bold shadow-xs ${className}`}>
    <svg viewBox="0 0 28 32" className="h-3.5 w-auto shrink-0" fill="none">
      <path d="M17.6 0H5.6L0 12.8h11.2L5.6 32l16.8-14.4h-9.6L17.6 0z" fill="#3395FF" />
    </svg>
    <span className="text-white/90">SECURED BY <strong className="text-[#3395FF] tracking-wide">RAZORPAY</strong></span>
  </div>
);

// Official RuPay Card Logo
export const RupayLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 72 20" className={`inline-block ${className}`} fill="none">
    {/* Blue and Orange dual slashes */}
    <path d="M4 17L12 3h5L9 17H4z" fill="#0971B8" />
    <path d="M12 17L20 3h5L17 17h-5z" fill="#F37021" />
    <text x="27" y="15" fill="#0971B8" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="13" fontStyle="italic">
      RuPay
    </text>
  </svg>
);

// PhonePe Logo
export const PhonePeLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 24 24" className={`inline-block ${className}`}>
    <rect width="24" height="24" rx="12" fill="#5f259f" />
    <text x="12" y="17" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontSize="14" textAnchor="middle">
      पे
    </text>
  </svg>
);

// Paytm Logo
export const PaytmLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 52 18" className={`inline-block ${className}`} fill="none">
    <text x="0" y="14" fill="#002970" fontFamily="sans-serif" fontWeight="900" fontSize="13">
      pay
    </text>
    <text x="26" y="14" fill="#00BAF2" fontFamily="sans-serif" fontWeight="900" fontSize="13">
      tm
    </text>
  </svg>
);

// BHIM UPI Logo
export const BhimLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 46 16" className={`inline-block ${className}`} fill="none">
    <path d="M0 16L8 0h6L6 16H0z" fill="#008450" />
    <path d="M8 16L16 0h6L14 16H8z" fill="#F37021" />
    <text x="20" y="13" fill="#0971B8" fontFamily="sans-serif" fontWeight="bold" fontSize="11">
      BHIM
    </text>
  </svg>
);

