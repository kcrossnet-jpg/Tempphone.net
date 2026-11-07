import React from 'react';

interface CountryFlagProps {
  iso: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ iso, className = '', size = 'md' }) => {
  const dimensions = {
    sm: 'w-4 h-3',
    md: 'w-5 h-3.5',
    lg: 'w-6 h-4.5'
  }[size];

  const code = iso.toUpperCase();

  // Vector SVG definitions for razor-sharp rendering on Retina/4K screens
  const renderSvg = () => {
    switch (code) {
      case 'US':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <g fillRule="evenodd">
              <path fill="#bd3d44" d="M0 0h640v480H0z"/>
              <path stroke="#fff" strokeWidth="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"/>
              <path fill="#192f5d" d="M0 0h260v258.5H0z"/>
              <g fill="#fff">
                <circle cx="30" cy="25" r="8"/>
                <circle cx="70" cy="25" r="8"/>
                <circle cx="110" cy="25" r="8"/>
                <circle cx="150" cy="25" r="8"/>
                <circle cx="190" cy="25" r="8"/>
                <circle cx="230" cy="25" r="8"/>
                <circle cx="50" cy="55" r="8"/>
                <circle cx="90" cy="55" r="8"/>
                <circle cx="130" cy="55" r="8"/>
                <circle cx="170" cy="55" r="8"/>
                <circle cx="210" cy="55" r="8"/>
                <circle cx="30" cy="85" r="8"/>
                <circle cx="70" cy="85" r="8"/>
                <circle cx="110" cy="85" r="8"/>
                <circle cx="150" cy="85" r="8"/>
                <circle cx="190" cy="85" r="8"/>
                <circle cx="230" cy="85" r="8"/>
                <circle cx="50" cy="115" r="8"/>
                <circle cx="90" cy="115" r="8"/>
                <circle cx="130" cy="115" r="8"/>
                <circle cx="170" cy="115" r="8"/>
                <circle cx="210" cy="115" r="8"/>
                <circle cx="30" cy="145" r="8"/>
                <circle cx="70" cy="145" r="8"/>
                <circle cx="110" cy="145" r="8"/>
                <circle cx="150" cy="145" r="8"/>
                <circle cx="190" cy="145" r="8"/>
                <circle cx="230" cy="145" r="8"/>
                <circle cx="50" cy="175" r="8"/>
                <circle cx="90" cy="175" r="8"/>
                <circle cx="130" cy="175" r="8"/>
                <circle cx="170" cy="175" r="8"/>
                <circle cx="210" cy="175" r="8"/>
                <circle cx="30" cy="205" r="8"/>
                <circle cx="70" cy="205" r="8"/>
                <circle cx="110" cy="205" r="8"/>
                <circle cx="150" cy="205" r="8"/>
                <circle cx="190" cy="205" r="8"/>
                <circle cx="230" cy="205" r="8"/>
                <circle cx="50" cy="235" r="8"/>
                <circle cx="90" cy="235" r="8"/>
                <circle cx="130" cy="235" r="8"/>
                <circle cx="170" cy="235" r="8"/>
                <circle cx="210" cy="235" r="8"/>
              </g>
            </g>
          </svg>
        );
      case 'CA':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <g fillRule="evenodd">
              <path fill="#d52b1e" d="M0 0h160v480H0zm480 0h160v480H480z"/>
              <path fill="#fff" d="M160 0h320v480H160z"/>
              <path fill="#d52b1e" d="M320 120l18 48 35-18-12 42 42 6-27 34 32 28-50 4 12 36-40-24-10 44-10-44-40 24 12-36-50-4 32-28-27-34 42-6-12-42 35 18z"/>
            </g>
          </svg>
        );
      case 'GB':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <clipPath id="gb-a"><path d="M0 0v480h640V0z"/></clipPath>
            <clipPath id="gb-b"><path d="M0 0l640 480M640 0L0 480"/></clipPath>
            <g clipPath="url(#gb-a)">
              <path fill="#012169" d="M0 0h640v480H0z"/>
              <path stroke="#fff" strokeWidth="60" d="M0 0l640 480M640 0L0 480"/>
              <path stroke="#c8102e" strokeWidth="40" d="M0 0l640 480M640 0L0 480"/>
              <path stroke="#fff" strokeWidth="100" d="M320 0v480M0 240h640"/>
              <path stroke="#c8102e" strokeWidth="60" d="M320 0v480M0 240h640"/>
            </g>
          </svg>
        );
      case 'DE':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ffce00" d="M0 320h640v160H0z"/>
            <path fill="#d00" d="M0 160h640v160H0z"/>
            <path fill="#000" d="M0 0h640v160H0z"/>
          </svg>
        );
      case 'FR':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#002654" d="M0 0h213.3v480H0z"/>
            <path fill="#fff" d="M213.3 0h213.4v480H213.3z"/>
            <path fill="#ce1126" d="M426.7 0H640v480H426.7z"/>
          </svg>
        );
      case 'ES':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#c60b1e" d="M0 0h640v120H0zm0 360h640v120H0z"/>
            <path fill="#ffc400" d="M0 120h640v240H0z"/>
          </svg>
        );
      case 'IT':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#009246" d="M0 0h213.3v480H0z"/>
            <path fill="#fff" d="M213.3 0h213.4v480H213.3z"/>
            <path fill="#ce2b37" d="M426.7 0H640v480H426.7z"/>
          </svg>
        );
      case 'AU':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#00008b" d="M0 0h640v480H0z"/>
            <path stroke="#fff" strokeWidth="30" d="M0 0l320 240M320 0L0 240"/>
            <path stroke="#e00000" strokeWidth="20" d="M0 0l320 240M320 0L0 240"/>
            <path stroke="#fff" strokeWidth="50" d="M160 0v240M0 120h320"/>
            <path stroke="#e00000" strokeWidth="30" d="M160 0v240M0 120h320"/>
            <circle cx="160" cy="360" r="28" fill="#fff"/>
            <circle cx="480" cy="120" r="14" fill="#fff"/>
            <circle cx="530" cy="200" r="14" fill="#fff"/>
            <circle cx="480" cy="320" r="14" fill="#fff"/>
            <circle cx="430" cy="220" r="14" fill="#fff"/>
          </svg>
        );
      case 'JP':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#fff" d="M0 0h640v480H0z"/>
            <circle cx="320" cy="240" r="120" fill="#bc002d"/>
          </svg>
        );
      case 'IN':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ff9933" d="M0 0h640v160H0z"/>
            <path fill="#fff" d="M0 160h640v160H0z"/>
            <path fill="#128807" d="M0 320h640v160H0z"/>
            <circle cx="320" cy="240" r="45" fill="none" stroke="#000088" strokeWidth="6"/>
          </svg>
        );
      case 'BR':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#009c3b" d="M0 0h640v480H0z"/>
            <path fill="#ffdf00" d="M320 40L580 240 320 440 60 240z"/>
            <circle cx="320" cy="240" r="95" fill="#002776"/>
          </svg>
        );
      case 'MX':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#006847" d="M0 0h213.3v480H0z"/>
            <path fill="#fff" d="M213.3 0h213.4v480H213.3z"/>
            <path fill="#ce1126" d="M426.7 0H640v480H426.7z"/>
            <circle cx="320" cy="240" r="28" fill="#8b5a2b"/>
          </svg>
        );
      case 'ZA':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#e03c31" d="M0 0h640v240H0z"/>
            <path fill="#001489" d="M0 240h640v240H0z"/>
            <path stroke="#fff" strokeWidth="80" d="M0 0l320 240L0 480h160l240-180h240v-120H400L160 0z"/>
            <path stroke="#007749" strokeWidth="50" d="M0 0l320 240L0 480h160l240-180h240v-120H400L160 0z"/>
            <path fill="#ffb81c" d="M0 60l180 180L0 420z"/>
            <path fill="#000" d="M0 80l160 160L0 400z"/>
          </svg>
        );
      case 'SG':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#ed2939" d="M0 0h640v240H0z"/>
            <path fill="#fff" d="M0 240h640v240H0z"/>
            <path fill="#fff" d="M120 70a50 50 0 100 100 60 60 0 110-100z"/>
          </svg>
        );
      case 'AE':
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <path fill="#00732f" d="M160 0h480v160H160z"/>
            <path fill="#fff" d="M160 160h480v160H160z"/>
            <path fill="#000" d="M160 320h480v160H160z"/>
            <path fill="#f00" d="M0 0h160v480H0z"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 640 480" className="w-full h-full object-cover">
            <rect width="640" height="480" fill="#e2e8f0"/>
            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#64748b" fontSize="160" fontFamily="sans-serif">
              {code}
            </text>
          </svg>
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-xs overflow-hidden shadow-xs border border-black/15 ${dimensions} ${className}`}
      style={{ imageRendering: '-webkit-optimize-contrast' }}
      title={`Country: ${code}`}
      aria-label={`${code} flag`}
    >
      {renderSvg()}
    </span>
  );
};
