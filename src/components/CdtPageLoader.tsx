import React from 'react';
import { Cpu, ShieldCheck, Zap } from 'lucide-react';

export interface CdtPageLoaderProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  inline?: boolean;
  className?: string;
}

export const CdtPageLoader: React.FC<CdtPageLoaderProps> = ({
  message = 'Loading Cyber Dynamic Technologies...',
  submessage = 'Verified IT Hardware & Enterprise Solutions • Kampala, Uganda',
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
      {/* Brand Icon & Pulsing Halo Ring */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-cyan-500/20 via-rose-600/15 to-emerald-500/20 blur-xl animate-pulse" />

        {/* Animated Outer Spinner Ring */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-slate-200 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-cyan-600 border-r-rose-700 animate-spin" />
          <div className="absolute inset-1.5 rounded-full border border-slate-100/80" />

          {/* CDT Center Logo Container */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center p-2 overflow-hidden">
            <img
              src="/logo.png"
              alt="Cyber Dynamic Technologies (CDT)"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to secondary asset if /logo.png fails
                const img = e.currentTarget as HTMLImageElement;
                if (!img.dataset.failed) {
                  img.dataset.failed = 'true';
                  img.src = '/assets/cyber-dynamic-technologies-logo.jpg';
                }
              }}
            />
          </div>
        </div>

        {/* Floating Mini Tech Badge */}
        <div className="absolute -bottom-1 -right-1 bg-slate-900 text-cyan-400 p-1.5 rounded-full shadow-lg border border-cyan-500/30">
          <Cpu className="w-3.5 h-3.5 animate-pulse" />
        </div>
      </div>

      {/* Brand Title & Typography */}
      <div className="space-y-1.5 max-w-sm mx-auto">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-black uppercase tracking-wider mb-1">
          <Zap className="w-3 h-3 text-cyan-600 fill-cyan-600" />
          <span>Cyber Dynamic Technologies</span>
        </div>
        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          {message}
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          {submessage}
        </p>
      </div>

      {/* High-End Loading Progress Bar */}
      <div className="w-48 sm:w-56 mt-5">
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 relative">
          <div className="h-full bg-gradient-to-r from-cyan-600 via-rose-700 to-emerald-600 rounded-full w-2/3 animate-cdt-shimmer" />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-2 px-0.5">
          <span className="flex items-center gap-1 text-emerald-600">
            <ShieldCheck className="w-3 h-3" />
            Genuine Stock
          </span>
          <span className="text-slate-400">Kampala Dispatch</span>
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      >
        <div className="bg-white/98 rounded-2xl shadow-2xl border border-slate-200 max-w-md w-11/12 mx-auto overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-cyan-600 via-rose-700 to-emerald-600" />
          {content}
        </div>
      </div>
    );
  }

  return content;
};
