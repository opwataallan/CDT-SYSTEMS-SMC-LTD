import React from 'react';
import { ShieldCheck } from 'lucide-react';

export interface CdtPageLoaderProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  inline?: boolean;
  className?: string;
}

export const CdtPageLoader: React.FC<CdtPageLoaderProps> = ({
  message = 'Loading Cyber Dynamic Technologies...',
  submessage = 'Technology • Solutions • Growth',
  fullScreen = true,
  inline = false,
  className = '',
}) => {
  const content = (
    <div
      id="cdt-page-loader"
      className={`relative flex flex-col items-center justify-center text-center p-6 sm:p-8 select-none transition-all duration-300 ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* CDT Official Logo Container */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Soft Ambient Brand Glow */}
        <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-red-600/10 via-rose-500/10 to-cyan-500/10 blur-xl animate-pulse" />

        {/* Clean Logo Presentation - Keeping the original logo intact */}
        <div className="relative px-5 py-3 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Cyber Dynamic Technologies"
            className="w-52 sm:w-64 max-w-[75vw] h-auto object-contain transition-transform duration-500 hover:scale-102"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.dataset.failed) {
                img.dataset.failed = 'true';
                img.src = '/assets/cyber-dynamic-technologies-logo.jpg';
              }
            }}
          />
        </div>
      </div>

      {/* Brand Title & Loading Status */}
      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
          <span>{message}</span>
        </h3>
        {submessage && (
          <p className="text-xs text-slate-500 font-medium">
            {submessage}
          </p>
        )}
      </div>

      {/* Sleek Linear Loading Progress Bar */}
      <div className="w-48 sm:w-56 mt-4">
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 relative">
          <div className="h-full bg-gradient-to-r from-[#920d35] via-cyan-600 to-[#007f19] rounded-full w-2/3 animate-cdt-shimmer" />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-2 px-0.5">
          <span className="flex items-center gap-1 text-emerald-600">
            <ShieldCheck className="w-3 h-3" />
            Genuine Stock
          </span>
          <span className="text-slate-400">Verified IT Hardware</span>
        </div>
      </div>
    </div>
  );

  if (inline) {
    return content;
  }

  if (fullScreen) {
    return (
      <div
        id="cdt-fullscreen-page-loader"
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      >
        <div className="bg-white/98 rounded-3xl shadow-2xl border border-slate-200 max-w-md w-11/12 mx-auto overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="h-1 bg-gradient-to-r from-[#920d35] via-cyan-600 to-[#007f19]" />
          {content}
        </div>
      </div>
    );
  }

  return content;
};
