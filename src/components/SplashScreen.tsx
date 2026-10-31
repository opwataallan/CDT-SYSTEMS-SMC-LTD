import React, { useState, useEffect } from 'react';
import { CdtLogoSpinner } from './CdtLogoSpinner';
import { ShieldCheck, Sparkles } from 'lucide-react';

export interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
  alwaysShow?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDurationMs = 1500,
  alwaysShow = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Smooth progress increment
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(98, prev + Math.floor(Math.random() * 25) + 12);
      });
    }, 200);

    // Auto dismiss after minDurationMs
    const timer = setTimeout(() => {
      setProgress(100);
      setIsFading(true);
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 500);
      return () => clearTimeout(dismissTimer);
    }, minDurationMs);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [minDurationMs, onFinish]);

  if (!isVisible && !alwaysShow) {
    return null;
  }

  return (
    <div
      id="cdt-app-splash-screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 sm:p-10 bg-[#0f172a] text-white select-none transition-opacity duration-500 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Cyber Dynamic Technologies App Splash Screen"
    >
      {/* Background Atmosphere: Rich Maroon & Gold Radial Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-[#920d35]/20 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-[#f59e0b]/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#580c1f]/30 blur-2xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Top Header info */}
      <div className="relative z-10 w-full flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold tracking-wider uppercase">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Uganda Tech Marketplace
        </span>
        <button
          type="button"
          onClick={() => {
            setIsFading(true);
            setTimeout(() => {
              setIsVisible(false);
              if (onFinish) onFinish();
            }, 300);
          }}
          className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer"
        >
          Skip &rarr;
        </button>
      </div>

      {/* Main Center Content: CDT Round Logo with Spinning Circle */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 max-w-sm">
        {/* The Animated CDT Logo Spinner */}
        <div className="transform transition-transform hover:scale-105 duration-300">
          <CdtLogoSpinner size="2xl" variant="brand" showGlow={true} />
        </div>

        {/* Brand Names & Tagline */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
            Cyber Dynamic <span className="text-[#f59e0b]">Technologies</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-slate-300/90">
            Technology • Solutions • Growth
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-56 sm:w-64 space-y-2 pt-2">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
            <div
              className="h-full bg-gradient-to-r from-[#920d35] via-[#f59e0b] to-[#920d35] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Loading catalog...</span>
            <span className="font-mono text-amber-400">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Verification Badges */}
      <div className="relative z-10 flex items-center justify-center gap-4 text-[11px] text-slate-400 border-t border-white/5 pt-4 w-full max-w-xs">
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          100% Genuine IT Hardware
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400">Kampala &amp; Nationwide</span>
      </div>
    </div>
  );
};
