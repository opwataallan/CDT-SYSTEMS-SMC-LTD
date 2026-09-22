import React, { useState } from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidAppInstallModal } from './AndroidAppInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'button' | 'pill' | 'mobile-nav';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed, hide the button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          id="header-install-android-btn"
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#007f19] border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${className}`}
          title="Install Android App"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Android App</span>
          <span className="md:hidden">App</span>
        </button>
      )}

      {variant === 'pill' && (
        <button
          id="pill-install-android-btn"
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#007f19] hover:bg-[#006013] text-white text-[11px] font-black shadow-xs transition-all cursor-pointer ${className}`}
        >
          <Download className="w-3 h-3" />
          <span>Get Android App</span>
        </button>
      )}

      {variant === 'mobile-nav' && (
        <button
          id="mobile-nav-install-android-btn"
          type="button"
          onClick={handleClick}
          className={`flex flex-col items-center justify-center text-slate-600 hover:text-[#007f19] transition-colors py-1 cursor-pointer ${className}`}
        >
          <Smartphone className="w-5 h-5 mb-0.5 text-[#007f19]" />
          <span className="text-[10px] font-bold">App</span>
        </button>
      )}

      {variant === 'button' && (
        <button
          id="btn-install-android"
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#007f19] to-[#005711] hover:from-[#006013] hover:to-[#00470e] px-4 py-2 text-xs font-black text-white shadow-sm transition active:scale-95 cursor-pointer ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Install Android App</span>
        </button>
      )}

      <AndroidAppInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
