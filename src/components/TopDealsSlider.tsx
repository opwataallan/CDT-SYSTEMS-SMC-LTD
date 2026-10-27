import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Clock, ArrowRight, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { SliderProductCard } from './SliderProductCard';
import { useShop } from '../context/ShopContext';
import { useDraggableSlider } from '../hooks/useDraggableSlider';

interface TopDealsSliderProps {
  products: Product[];
}

export const TopDealsSlider: React.FC<TopDealsSliderProps> = ({ products }) => {
  const { setCurrentView, config } = useShop();

  const topDealsConfig = config?.homepage?.top_deals;

  // Active campaign title and status state
  const [activeCampaignTitle, setActiveCampaignTitle] = useState(
    topDealsConfig?.campaign_title || 'Top Deals in Uganda'
  );
  const [isPromotionClosed, setIsPromotionClosed] = useState(false);

  // Sync title when settings change
  useEffect(() => {
    if (topDealsConfig?.campaign_title) {
      setActiveCampaignTitle(topDealsConfig.campaign_title);
      setIsPromotionClosed(false);
    }
  }, [topDealsConfig?.campaign_title, topDealsConfig?.end_time]);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 8,
    minutes: 42,
    seconds: 15,
  });

  // Calculate countdown based on settings or running timer
  useEffect(() => {
    if (topDealsConfig?.enabled === false) {
      return;
    }

    const calculateTimeRemaining = () => {
      if (topDealsConfig?.end_time) {
        const target = new Date(topDealsConfig.end_time).getTime();
        const now = Date.now();
        const diff = target - now;

        if (diff <= 0) {
          // Time expired! Handle auto_action
          const action = topDealsConfig.auto_action || 'switch_next';
          if (action === 'close') {
            setIsPromotionClosed(true);
            return { hours: 0, minutes: 0, seconds: 0 };
          } else if (action === 'switch_next') {
            setActiveCampaignTitle(topDealsConfig.next_campaign_title || 'Upcoming Flash Tech Sale');
            // Provide a new 12 hour cycle for the switched campaign
            return { hours: 11, minutes: 59, seconds: 59 };
          } else {
            // repeat
            return { hours: topDealsConfig.duration_hours || 12, minutes: 0, seconds: 0 };
          }
        }

        const totalSecs = Math.floor(diff / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        return { hours, minutes, seconds };
      }

      return null;
    };

    const initial = calculateTimeRemaining();
    if (initial) {
      setTimeLeft(initial);
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      if (remaining) {
        setTimeLeft(remaining);
      } else {
        setTimeLeft((prev) => {
          if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
          if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
          if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };

          // Time hit 0 in fallback mode
          const action = topDealsConfig?.auto_action || 'switch_next';
          if (action === 'close') {
            setIsPromotionClosed(true);
            return { hours: 0, minutes: 0, seconds: 0 };
          } else if (action === 'switch_next') {
            setActiveCampaignTitle(topDealsConfig?.next_campaign_title || 'Midnight Tech Flash Sale');
            return { hours: 12, minutes: 0, seconds: 0 };
          } else {
            return { hours: 8, minutes: 30, seconds: 0 };
          }
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    topDealsConfig?.end_time,
    topDealsConfig?.auto_action,
    topDealsConfig?.next_campaign_title,
    topDealsConfig?.duration_hours,
    topDealsConfig?.enabled,
  ]);

  // If disabled in settings, return null
  if (topDealsConfig?.enabled === false) {
    return null;
  }

  // Filter top deals: match with the products selected in settings, or discount items
  const dealProducts = useMemo(() => {
    const safe = Array.isArray(products) ? products : [];

    // 1. If admin settings configured specific products for this promotion
    if (
      topDealsConfig?.selected_product_ids &&
      Array.isArray(topDealsConfig.selected_product_ids) &&
      topDealsConfig.selected_product_ids.length > 0
    ) {
      const matched = safe.filter((p) =>
        topDealsConfig.selected_product_ids?.includes(p.id)
      );
      if (matched.length > 0) return matched;
    }

    // 2. Otherwise default to items with discount or flash_sale
    const withDiscount = safe.filter(
      (p) => p && (p.flash_sale || (p.regular_price && p.regular_price > p.price))
    );

    // If fewer than 6, supplement with featured products
    if (withDiscount.length < 6) {
      const rest = safe.filter((p) => !withDiscount.some((d) => d.id === p.id));
      return [...withDiscount, ...rest].slice(0, 12);
    }
    return withDiscount;
  }, [products, topDealsConfig?.selected_product_ids]);

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

  // If promotion closed automatically
  if (isPromotionClosed) {
    return (
      <section id="top-deals-section-closed" className="max-w-7xl mx-auto px-4">
        <div className="bg-slate-900 rounded-xl p-4 text-center border border-slate-800 text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-bold text-white">Promotion Concluded</h3>
              <p className="text-xs text-slate-400">
                The {activeCampaignTitle} counter has reached 0 and is now closed. Check back soon for our next special deals!
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('shop')}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
          >
            Explore Full Catalog
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="top-deals-section" className="max-w-7xl mx-auto px-4">
      <div className="bg-[#0F172A] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-white border border-slate-800 shadow-md relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header row: Title + Clean Countdown Timer + Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800 relative z-10">
          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Flame className="w-4 h-4 fill-slate-950 text-slate-950" />
            </div>
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-white">
              {activeCampaignTitle}
            </h2>
          </div>

          {/* CLEAN COUNTDOWN TIMER & CONTROLS */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="flex items-center gap-1 font-mono font-bold text-xs text-white">
                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </span>
                <span className="text-slate-500">:</span>
                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </span>
                <span className="text-slate-500">:</span>
                <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>

            {/* Navigation arrows + View All */}
            <div className="flex items-center gap-1">
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
                title="Scroll left"
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
                title="Scroll right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentView('shop', { flash_sale: true })}
                className="py-1 px-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-1 shadow-xs"
              >
                <span>All Deals</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Track */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="w-full overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none mt-2 pt-0.5 pb-1 touch-pan-x"
          style={{
            touchAction: 'pan-x pan-y',
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
      </div>
    </section>
  );
};
