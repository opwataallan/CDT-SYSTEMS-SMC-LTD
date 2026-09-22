import React, { useState, useEffect } from 'react';
import { Download, X, BellRing } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallBannerProps {
  onOpenModal?: () => void;
}

export const AndroidInstallBanner: React.FC<AndroidInstallBannerProps> = ({ onOpenModal }) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('cdt_pwa_banner_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  // Suppress when already installed or dismissed
  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('cdt_pwa_banner_dismissed', 'true');
    } catch {}
  };

  const handleDownloadClick = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isInstallable) {
      const accepted = await install();
      if (!accepted && onOpenModal) {
        onOpenModal();
      }
    } else if (onOpenModal) {
      onOpenModal();
    }
  };

  return (
    <div
      id="download-notification-bar"
      role="alert"
      className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white px-3 sm:px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-md border-b border-emerald-500/30 relative z-30 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-400/40 text-emerald-400">
          <BellRing className="w-3.5 h-3.5 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-slate-900"></span>
        </div>
        <div className="min-w-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase tracking-wider border border-emerald-500/40 flex-shrink-0">
            Download Notification
          </span>
          <p className="text-[11px] sm:text-xs text-slate-200 truncate">
            {isAndroid
              ? 'Cyber Dynamic Android App is available for faster loading & push order tracking.'
              : 'Download Cyber Dynamic App for home screen access & instant order updates.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <a
          id="download-app-link"
          href="#download-app"
          onClick={handleDownloadClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] sm:text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 group underline decoration-slate-950/40 underline-offset-2"
          title="Download Cyber Dynamic Mobile App"
        >
          <Download className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
          <span>Download App</span>
        </a>

        <button
          id="dismiss-download-notification-btn"
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss notification"
          aria-label="Dismiss download notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
