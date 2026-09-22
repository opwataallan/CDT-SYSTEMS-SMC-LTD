import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  Zap,
  WifiOff,
  BellRing,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppInstallModal: React.FC<AndroidAppInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefits' | 'chrome_guide' | 'samsung_guide'>('benefits');

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const accepted = await install();
      if (accepted) {
        setInstalledSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      id="android-install-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="android-install-modal-card"
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header with Android Brand Styling */}
        <div className="bg-gradient-to-r from-[#007f19] via-[#006013] to-slate-950 text-white p-4 sm:p-5 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* App Icon */}
              <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-lg border-2 border-amber-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src="/pwa-192x192.png"
                  alt="Cyber Dynamic App Icon"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    // Fallback to SVG if png not loaded
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-300 tracking-wider uppercase">
                    Android WebAPK
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white/20 text-white">
                    Official
                  </span>
                </div>
                <h3 className="font-black text-base sm:text-lg tracking-tight leading-snug">
                  Cyber Dynamic Uganda
                </h3>
                <p className="text-[11px] text-emerald-100 font-medium">
                  ICT Hardware, Computers & Electronics Marketplace
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Banners */}
          {isInstalled || installedSuccess ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#007f19] flex-shrink-0" />
              <div>
                <p className="font-bold text-xs">App is already installed!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  You can launch Cyber Dynamic anytime from your Android Home Screen or App Drawer.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#007f19]" />
                <span className="font-bold text-slate-800">
                  {isAndroid ? 'Detected: Android Device' : 'Install on Android / Mobile'}
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-[#007f19] uppercase tracking-wider bg-white px-2 py-0.5 rounded shadow-2xs border border-emerald-100">
                0 MB Extra Space
              </span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-slate-100 pb-1">
            <button
              onClick={() => setActiveTab('benefits')}
              className={`pb-1.5 px-2.5 font-bold text-xs transition-colors cursor-pointer border-b-2 ${
                activeTab === 'benefits'
                  ? 'border-[#007f19] text-[#007f19]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              App Benefits
            </button>
            <button
              onClick={() => setActiveTab('chrome_guide')}
              className={`pb-1.5 px-2.5 font-bold text-xs transition-colors cursor-pointer border-b-2 ${
                activeTab === 'chrome_guide'
                  ? 'border-[#007f19] text-[#007f19]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Chrome Guide
            </button>
            <button
              onClick={() => setActiveTab('samsung_guide')}
              className={`pb-1.5 px-2.5 font-bold text-xs transition-colors cursor-pointer border-b-2 ${
                activeTab === 'samsung_guide'
                  ? 'border-[#007f19] text-[#007f19]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Samsung / Other
            </button>
          </div>

          {/* Tab 1: Benefits */}
          {activeTab === 'benefits' && (
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-[#007f19] flex-shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Instant Android Launch</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Opens like a native Android APK in full-screen standalone mode without any browser URL bar.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800 flex-shrink-0 mt-0.5">
                  <WifiOff className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Offline Catalog & Low Data Mode</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Caches products, images, and cart offline so you can browse even with weak Ugandan cellular signal.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0 mt-0.5">
                  <BellRing className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Real-time Price Drop & Order Alerts</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Receive price reduction alerts and live dispatch updates directly to your device.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-800 flex-shrink-0 mt-0.5">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">MTN MoMo & Airtel Money Native Checkout</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fast, 1-tap mobile money checkout with instant automated payment receipts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Chrome Android Guide */}
          {activeTab === 'chrome_guide' && (
            <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#007f19]" />
                <span>How to Install via Google Chrome on Android:</span>
              </h4>
              <ol className="space-y-2 text-[11px] text-slate-600 list-decimal pl-4 font-medium">
                <li>
                  Tap the <strong>three vertical dots (⋮)</strong> in the top right corner of Chrome.
                </li>
                <li>
                  Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </li>
                <li>
                  Tap <strong>"Install"</strong> when prompted. Chrome will create an official Android WebAPK icon on your launcher!
                </li>
              </ol>
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-[10px] text-slate-500">
                Tip: If you don't see the three dots menu, tap the green <strong>"Install Android App Now"</strong> button below.
              </div>
            </div>
          )}

          {/* Tab 3: Samsung / Other Browsers Guide */}
          {activeTab === 'samsung_guide' && (
            <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs">For Samsung Internet, Opera, or Firefox:</h4>
              <div className="space-y-2 text-[11px] text-slate-600 font-medium">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <strong className="text-slate-800">Samsung Internet:</strong> Tap the menu bar at the bottom right (three horizontal lines ☰) and choose <strong>"Add page to" &gt; "Home screen"</strong>.
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <strong className="text-slate-800">Firefox Android:</strong> Tap the menu button (⋮) and select <strong>"Install"</strong>.
                </div>
                {isIOS && (
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                    <strong className="text-amber-950">iOS (iPhone/iPad):</strong> Tap Safari's <strong>Share</strong> button, then tap <strong>"Add to Home Screen"</strong>.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security & Verification Guarantee */}
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#007f19]" />
              <span>Verified Android WebAPK Security</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold">SSL Sealed</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {isInstallable ? (
              <button
                id="native-install-android-app-btn"
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#007f19] to-[#005711] hover:from-[#006013] hover:to-[#00470e] text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                <Download className="w-4 h-4" />
                <span>{installing ? 'Installing...' : 'Install Android App Now'}</span>
              </button>
            ) : (
              <button
                id="guide-install-android-app-btn"
                type="button"
                onClick={() => {
                  if (activeTab === 'benefits') {
                    setActiveTab('chrome_guide');
                  } else {
                    onClose();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#007f19] hover:bg-[#006013] text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{activeTab === 'benefits' ? 'View Install Steps' : 'Got It'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
