import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Zap, Gift, Truck, ShieldCheck, Flame, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface TopAdSlide {
  id: number;
  badge: string;
  badgeColor: string;
  headline: string;
  subtext: string;
  ctaText: string;
  ctaAction: 'flash_sale' | 'pickup_hubs' | 'laptops' | 'warranty';
  gifUrl: string;
  bgGradient: string;
}

const AD_SLIDES: TopAdSlide[] = [
  {
    id: 1,
    badge: '🔥 FLASH SALE 40% OFF',
    badgeColor: 'bg-rose-500 text-white animate-pulse',
    headline: 'UGANDA TECH MEGA DEALS — HP LAPTOPS, EPSON PRINTERS & 4G MIFI',
    subtext: 'Same-day delivery across Kampala & nationwide dispatch to your chosen district',
    ctaText: 'Claim Discount',
    ctaAction: 'flash_sale',
    // Dynamic animated tech sale GIF
    gifUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
    bgGradient: 'from-slate-950 via-slate-900 to-cyan-950',
  },
  {
    id: 2,
    badge: '🚚 NATIONWIDE DELIVERY',
    badgeColor: 'bg-amber-400 text-slate-950 animate-bounce font-black',
    headline: 'FREE DISTRICT PICKUP STATIONS ACROSS UGANDA!',
    subtext: 'Choose your district to collect your order at our verified district station',
    ctaText: 'View District Hubs',
    ctaAction: 'pickup_hubs',
    gifUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80',
    bgGradient: 'from-cyan-950 via-slate-900 to-slate-950',
  },
  {
    id: 3,
    badge: '⚡ INSTANT MOMO VERIFY',
    badgeColor: 'bg-emerald-500 text-white animate-pulse',
    headline: 'PAY DIRECT VIA MTN & AIRTEL MOBILE MONEY (0394760459)',
    subtext: 'Instant finance team verification, official automated invoice & express dispatch',
    ctaText: 'Shop Catalog',
    ctaAction: 'laptops',
    gifUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&auto=format&fit=crop&q=80',
    bgGradient: 'from-emerald-950 via-slate-900 to-slate-950',
  },
  {
    id: 4,
    badge: '🛡️ 1-YEAR WARRANTY',
    badgeColor: 'bg-cyan-500 text-white animate-pulse',
    headline: '100% TESTED & CERTIFIED TECH HARDWARE WITH CDT WARRANTY',
    subtext: 'Dell, HP, Lenovo, Canon & Hikvision — 14-day replacement & lifetime tech support',
    ctaText: 'Learn More',
    ctaAction: 'warranty',
    gifUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&auto=format&fit=crop&q=80',
    bgGradient: 'from-blue-950 via-slate-900 to-slate-950',
  },
];

export const TopFlashingAdsBar: React.FC = () => {
  const { setCurrentView } = useShop();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Auto transition every 3.8 seconds
  useEffect(() => {
    if (isPaused || isDismissed) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % AD_SLIDES.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isPaused, isDismissed]);

  if (isDismissed) return null;

  const currentSlide = AD_SLIDES[currentSlideIndex];

  const handleAction = () => {
    switch (currentSlide.ctaAction) {
      case 'flash_sale':
        setCurrentView('shop', { flash_sale: true });
        break;
      case 'pickup_hubs':
        setCurrentView('warranty');
        break;
      case 'laptops':
        setCurrentView('category', { slug: 'laptops-computers', name: 'Laptops & Computers' });
        break;
      case 'warranty':
        setCurrentView('warranty');
        break;
      default:
        setCurrentView('shop');
    }
  };

  return (
    // STRICT REQUIREMENT: "display only in pc not in mobile" -> hidden on mobile/tablets (< 1024px or < 768px: hidden md:block or hidden lg:block)
    <div
      id="cdt-top-flashing-pc-ads"
      className="hidden lg:block w-full bg-slate-950 border-b border-cyan-500/30 text-white relative z-50 overflow-hidden select-none transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated glowing top border accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-amber-400 via-rose-500 to-cyan-500 animate-gradient-x" />

      <div className={`w-full bg-gradient-to-r ${currentSlide.bgGradient} transition-colors duration-700 py-1.5 px-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Transitioning Animated GIF Visual & Flashing Badge */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Transitioning Animated GIF Thumbnail with Pulsing Ring */}
            <div className="relative w-8 h-8 rounded-md overflow-hidden ring-2 ring-cyan-400/80 shrink-0 shadow-sm shadow-cyan-500/50">
              <img
                src={currentSlide.gifUrl}
                alt="Tech Deal Animation"
                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <span className="absolute inset-0 bg-cyan-400/10 mix-blend-overlay pointer-events-none" />
            </div>

            {/* Live Flashing Pulsing Ad Pill */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider flex items-center gap-1 shadow-xs cursor-pointer ${currentSlide.badgeColor}`}
              onClick={handleAction}
            >
              <Zap className="w-3 h-3 shrink-0 animate-spin" />
              <span>{currentSlide.badge}</span>
            </span>

            {/* Pulsing "LIVE AD" Flashing Indicator */}
            <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold tracking-widest uppercase bg-rose-950/60 border border-rose-500/40 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>LIVE DEAL</span>
            </span>
          </div>

          {/* Center: Main Headline with Dynamic Flash & Transition Animation */}
          <div
            onClick={handleAction}
            className="flex-1 flex items-center justify-center gap-3 cursor-pointer group text-center min-w-0"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-xs font-black text-white tracking-wide group-hover:text-cyan-300 transition-colors truncate">
                {currentSlide.headline}
              </span>
              <span className="text-slate-400 text-xs hidden xl:inline">•</span>
              <span className="text-[11px] text-slate-300 font-medium hidden xl:inline truncate">
                {currentSlide.subtext}
              </span>
            </div>

            {/* Flashing Gold Action Button */}
            <span className="shrink-0 px-2.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm group-hover:scale-105 transition-all">
              <span>{currentSlide.ctaText}</span>
              <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          {/* Right: Slide Controls & Dismiss */}
          <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
            {/* Slide Index Indicators */}
            <div className="flex items-center gap-1 mr-2">
              {AD_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-1 rounded-full transition-all cursor-pointer ${
                    idx === currentSlideIndex ? 'w-4 bg-cyan-400' : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next Buttons */}
            <button
              onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + AD_SLIDES.length) % AD_SLIDES.length)}
              className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              aria-label="Previous Deal"
              title="Previous Deal"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % AD_SLIDES.length)}
              className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              aria-label="Next Deal"
              title="Next Deal"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Close Button */}
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer ml-1"
              aria-label="Close Announcement"
              title="Dismiss for this session"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
