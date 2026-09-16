import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Shield, Cookie, Check, X, Sliders, ChevronRight, Lock } from 'lucide-react';

interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'cdt_cookie_consent_v1';

export const CookieConsentBanner: React.FC = () => {
  const { config, setCurrentView } = useShop();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(true);
  const [marketingAllowed, setMarketingAllowed] = useState(true);

  const legalConfig = config?.legal;
  const isEnabled = legalConfig?.cookie_consent_enabled !== false;
  const bannerText =
    legalConfig?.cookie_banner_text ||
    'We use cookies and secure local storage to keep your shopping cart intact, secure checkout, and deliver high-speed performance across Uganda.';

  useEffect(() => {
    if (!isEnabled) {
      setIsVisible(false);
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Delay 1.2s for pleasant non-blocking entrance
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      } else {
        const parsed: CookiePreferences = JSON.parse(saved);
        setAnalyticsAllowed(parsed.analytics !== false);
        setMarketingAllowed(parsed.marketing !== false);
      }
    } catch {
      setIsVisible(true);
    }
  }, [isEnabled]);

  const saveConsent = (prefs: { analytics: boolean; marketing: boolean }) => {
    const data: CookiePreferences = {
      essential: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent({ analytics: true, marketing: true });
  };

  const handleRejectNonEssential = () => {
    saveConsent({ analytics: false, marketing: false });
  };

  const handleSaveCustom = () => {
    saveConsent({ analytics: analyticsAllowed, marketing: marketingAllowed });
  };

  if (!isEnabled || !isVisible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-16 md:bottom-4 left-3 right-3 md:left-6 md:right-auto md:max-w-xl z-50 bg-slate-900/98 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Privacy & Cookie Preferences</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  GDPR & Uganda DPPA
                </span>
              </h3>
              <button
                onClick={handleRejectNonEssential}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss and keep essential only"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {bannerText}{' '}
              <button
                type="button"
                onClick={() => setCurrentView('store-policies', { policy: 'cookie' })}
                className="text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer inline-flex items-center"
              >
                <span>Read Cookie Policy</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </p>

            {/* Custom Preferences Drawer Toggle */}
            {showPreferences && (
              <div className="mb-4 pt-3 border-t border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="pr-2">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Strictly Essential (Required)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Cart storage, checkout session, CSRF security</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    Always Active
                  </span>
                </div>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                  <div className="pr-2">
                    <div className="font-semibold text-white">Analytics & Performance</div>
                    <div className="text-[11px] text-slate-400">Helps us optimize store load speeds in Uganda</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={analyticsAllowed}
                    onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-600 focus:ring-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 cursor-pointer">
                  <div className="pr-2">
                    <div className="font-semibold text-white">Personalized Marketing</div>
                    <div className="text-[11px] text-slate-400">Flash deals and relevant electronics suggestions</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={marketingAllowed}
                    onChange={(e) => setMarketingAllowed(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-600 focus:ring-cyan-500"
                  />
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!showPreferences ? (
                <>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-900/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept All</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRejectNonEssential}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    Necessary Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPreferences(true)}
                    className="px-3 py-2 text-slate-300 hover:text-cyan-400 font-medium text-xs rounded-xl hover:bg-slate-800/50 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save My Choices</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreferences(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium cursor-pointer"
                  >
                    Back
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
