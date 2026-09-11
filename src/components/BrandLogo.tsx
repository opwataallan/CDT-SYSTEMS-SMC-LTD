import React from 'react';

export interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon' | 'mark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  inverted?: boolean;
  className?: string;
  customLogoUrl?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  inverted = false,
  className = '',
  customLogoUrl,
  onClick,
}) => {
  // Dimensions map
  const sizeConfig = {
    xs: { height: 'h-6', iconHeight: 'h-6', maxHeight: 24 },
    sm: { height: 'h-8', iconHeight: 'h-8', maxHeight: 32 },
    md: { height: 'h-10', iconHeight: 'h-10', maxHeight: 40 },
    lg: { height: 'h-13', iconHeight: 'h-13', maxHeight: 52 },
    xl: { height: 'h-16', iconHeight: 'h-16', maxHeight: 64 },
  }[size];

  const logoSrc = customLogoUrl || '/logo.png';

  const content = (
    <div
      id="cyber-dynamic-tech-brand-logo"
      className={`inline-flex items-center select-none transition-opacity hover:opacity-95 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Official Cyber Dynamic Technologies Logo */}
      <div className={`inline-flex items-center ${inverted ? 'bg-white/95 px-2 py-1 rounded-lg shadow-xs' : ''}`}>
        <img
          src={logoSrc}
          alt="Cyber Dynamic Technologies - Technology • Solutions • Growth"
          className={`${sizeConfig.height} w-auto max-w-full object-contain`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Graceful fallback if image fails
            (e.currentTarget as HTMLImageElement).src = '/assets/cyber-dynamic-technologies-logo.jpg';
          }}
        />
      </div>
    </div>
  );

  return content;
};
