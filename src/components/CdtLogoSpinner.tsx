import React from 'react';

export interface CdtLogoSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'brand' | 'gold' | 'maroon' | 'light';
  showGlow?: boolean;
  className?: string;
  imgClassName?: string;
  badgeShadow?: boolean;
  spinning?: boolean;
}

const LOGO_SRC = '/assets/aistudio/272125-removebg-preview_a76dc8ab.png';

export const CdtLogoSpinner: React.FC<CdtLogoSpinnerProps> = ({
  size = 'md',
  variant = 'brand',
  showGlow = true,
  className = '',
  imgClassName = '',
  badgeShadow = true,
  spinning = true,
}) => {
  // Dimension definitions
  const sizeMap = {
    xs: {
      container: 'w-9 h-9',
      logo: 'w-6 h-6',
      strokeWidth: 2.5,
      svgSize: 36,
    },
    sm: {
      container: 'w-12 h-12',
      logo: 'w-8 h-8',
      strokeWidth: 3,
      svgSize: 48,
    },
    md: {
      container: 'w-20 h-20',
      logo: 'w-14 h-14',
      strokeWidth: 3.5,
      svgSize: 80,
    },
    lg: {
      container: 'w-28 h-28',
      logo: 'w-20 h-20',
      strokeWidth: 4,
      svgSize: 112,
    },
    xl: {
      container: 'w-36 h-36',
      logo: 'w-26 h-26',
      strokeWidth: 4.5,
      svgSize: 144,
    },
    '2xl': {
      container: 'w-44 h-44',
      logo: 'w-32 h-32',
      strokeWidth: 5,
      svgSize: 176,
    },
  }[size];

  // Ring gradients based on selected variant
  const getGradientId = () => `cdt-spinner-grad-${variant}-${size}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeMap.container} ${className}`}
      role="status"
      aria-label="Loading Cyber Dynamic Technologies"
    >
      {/* Optional ambient color glow */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#920d35]/30 via-[#f59e0b]/25 to-cyan-500/20 blur-md pointer-events-none transform scale-110 animate-pulse"
          style={{ animationDuration: '3s' }}
        />
      )}

      {/* Spinning Circular Ring */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${spinning ? 'animate-spin' : ''}`}
        style={{ animationDuration: '1.4s', animationTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)' }}
        viewBox={`0 0 ${sizeMap.svgSize} ${sizeMap.svgSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Brand Tricolor Gradient: Dark Red -> Gold -> Maroon */}
          <linearGradient id={`cdt-spinner-grad-brand-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#920d35" stopOpacity="1" />
            <stop offset="45%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="85%" stopColor="#580c1f" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#920d35" stopOpacity="0.1" />
          </linearGradient>

          {/* Gold Luxury Accent Gradient */}
          <linearGradient id={`cdt-spinner-grad-gold-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="60%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.15" />
          </linearGradient>

          {/* Maroon Prestige Gradient */}
          <linearGradient id={`cdt-spinner-grad-maroon-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#580c1f" stopOpacity="1" />
            <stop offset="60%" stopColor="#920d35" stopOpacity="1" />
            <stop offset="100%" stopColor="#580c1f" stopOpacity="0.1" />
          </linearGradient>

          {/* Light High-Contrast Ring */}
          <linearGradient id={`cdt-spinner-grad-light-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Subtle static background track */}
        <circle
          cx={sizeMap.svgSize / 2}
          cy={sizeMap.svgSize / 2}
          r={(sizeMap.svgSize - sizeMap.strokeWidth * 2) / 2}
          stroke="currentColor"
          className="text-slate-200/40 dark:text-white/10"
          strokeWidth={Math.max(1.5, sizeMap.strokeWidth - 1.5)}
        />

        {/* Dynamic spinning accent circle */}
        <circle
          cx={sizeMap.svgSize / 2}
          cy={sizeMap.svgSize / 2}
          r={(sizeMap.svgSize - sizeMap.strokeWidth * 2) / 2}
          stroke={`url(#${getGradientId()})`}
          strokeWidth={sizeMap.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${sizeMap.svgSize * 1.8} ${sizeMap.svgSize * 0.9}`}
        />
      </svg>

      {/* Untouched Official CDT Logo in the Center */}
      <div
        className={`relative flex items-center justify-center rounded-full overflow-hidden ${sizeMap.logo} ${
          badgeShadow ? 'shadow-[0_4px_16px_rgba(146,13,53,0.35)]' : ''
        }`}
      >
        <img
          src={LOGO_SRC}
          alt="Cyber Dynamic Technologies Logo"
          className={`w-full h-full object-contain pointer-events-none transform transition-transform duration-300 hover:scale-105 ${imgClassName}`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (!img.dataset.failed) {
              img.dataset.failed = 'true';
              img.src = '/cdt-icon.png';
            }
          }}
        />
      </div>
    </div>
  );
};
