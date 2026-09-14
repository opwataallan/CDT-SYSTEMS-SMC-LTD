import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Clock, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { SliderProductCard } from './SliderProductCard';
import { useShop } from '../context/ShopContext';
import { useDraggableSlider } from '../hooks/useDraggableSlider';

interface TopDealsSliderProps {
  products: Product[];
}

export const TopDealsSlider: React.FC<TopDealsSliderProps> = ({ products }) => {
  const { setCurrentView } = useShop();

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 8,
    minutes: 42,
    seconds: 15,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter top deals: items with discount or marked as flash sale / top pick
  const dealProducts = useMemo(() => {
    const safe = Array.isArray(products) ? products : [];
    const withDiscount = safe.filter(
      (p) => p && (p.flash_sale || (p.regular_price && p.regular_price > p.price))
    );

    // If fewer than 6, supplement with featured or highly rated products
    if (withDiscount.length < 6) {
      const rest = safe.filter((p) => !withDiscount.some((d) => d.id === p.id));
      return [...withDiscount, ...rest].slice(0, 12);
    }
    return withDiscount;
  }, [products]);

  // Hook for user scrolling via mouse drag, touch swipe, trackpad, and mouse wheel
  const {
    containerRef,
    isDragging,
    hasMovedRef,
    canScrollLeft,
    canScrollRight,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    scrollByAmount,
  } = useDraggableSlider({ enableWheelScroll: true });

  return (
    <section id="top-deals-section" className="max-w-7xl mx-auto px-4">
      <div className="bg-[#0F172A] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-white border border-slate-800 shadow-md relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header row: Title + Bright High-Visibility Timer + Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2 border-b border-slate-800 relative z-10">
          {/* Title & Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950 text-slate-950 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                  <span>Top Deals in Uganda</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                  Save up to 30%
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400">
                Genuine tested hardware in Kampala • Scroll or drag to explore
              </p>
            </div>
          </div>

          {/* ULTRA CLEAR BRIGHT COUNTDOWN TIMER */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950 border-2 border-yellow-400 p-1 sm:p-1.5 rounded-xl shadow-[0_0_18px_rgba(250,204,21,0.4)]">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-400 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-xs">
                <Clock className="w-3.5 h-3.5 text-slate-950 animate-pulse stroke-[2.5]" />
                <span>DEALS END IN:</span>
              </div>

              {/* Luminous Bright High-Contrast Time Units */}
              <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm">
                {/* Hours Box */}
                <div className="flex flex-col items-center justify-center bg-yellow-300 border border-yellow-200 text-slate-950 px-2 py-0.5 rounded-lg min-w-[36px] sm:min-w-[42px] shadow-sm font-black">
                  <span className="leading-tight text-xs sm:text-sm font-black">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter text-slate-900 leading-none">
                    HRS
                  </span>
                </div>

                <span className="text-yellow-300 font-black text-xs sm:text-sm animate-pulse">:</span>

                {/* Minutes Box */}
                <div className="flex flex-col items-center justify-center bg-yellow-300 border border-yellow-200 text-slate-950 px-2 py-0.5 rounded-lg min-w-[36px] sm:min-w-[42px] shadow-sm font-black">
                  <span className="leading-tight text-xs sm:text-sm font-black">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter text-slate-900 leading-none">
                    MIN
                  </span>
                </div>

                <span className="text-yellow-300 font-black text-xs sm:text-sm animate-pulse">:</span>

                {/* Seconds Box - Bright Electric Coral with Live Animation */}
                <div className="flex flex-col items-center justify-center bg-gradient-to-b from-rose-500 to-red-600 border border-rose-400 text-white px-2 py-0.5 rounded-lg min-w-[36px] sm:min-w-[42px] shadow-md shadow-rose-500/50 font-black">
                  <span className="leading-tight text-xs sm:text-sm font-black animate-pulse">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter text-rose-100 leading-none">
                    SEC
                  </span>
                </div>
              </div>
            </div>

            {/* Optional helper navigation arrows + View All */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollByAmount(-300)}
                disabled={!canScrollLeft}
                aria-label="Previous Deals"
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  canScrollLeft
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                }`}
                title="Scroll left (or drag slider)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => scrollByAmount(300)}
                disabled={!canScrollRight}
                aria-label="Next Deals"
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  canScrollRight
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                }`}
                title="Scroll right (or drag slider)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentView('shop', { flash_sale: true })}
                className="py-1 px-2.5 sm:px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-1 shadow-sm"
              >
                <span>All Deals</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Track - Displays 3 Products in Mobile and 6 in PC */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="w-full overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none mt-2 pt-0.5 pb-1"
          style={{
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex items-stretch gap-1.5 sm:gap-2 md:gap-2.5 w-max">
            {dealProducts.map((product) => (
              <SliderProductCard
                key={`top-deal-${product.id}`}
                product={product}
                isDraggingRef={hasMovedRef}
              />
            ))}
          </div>
        </div>

        {/* Mobile Swipe Hint and User-Friendly Scroll Bar Indicator */}
        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="hidden xs:inline">Showing 3 deals on mobile, 6 on desktop •</span> Drag, swipe or wheel to scroll freely
          </span>
          <span className="text-slate-500 font-mono text-[9px]">
            {dealProducts.length} Flash Offers
          </span>
        </div>
      </div>
    </section>
  );
};
