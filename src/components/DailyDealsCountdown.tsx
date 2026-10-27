import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Flame,
  Zap,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { OptimizedImage } from './OptimizedImage';

interface DailyDealsCountdownProps {
  products: Product[];
  featuredProductId?: number;
}

export const DailyDealsCountdown: React.FC<DailyDealsCountdownProps> = ({
  products,
  featuredProductId,
}) => {
  const { setCurrentView, addToCart, formatPrice } = useShop();

  // Pick the top deal: explicitly requested id, or highest discount %, or flash sale
  const featuredDeal = useMemo(() => {
    if (!products || products.length === 0) return null;

    if (featuredProductId) {
      const found = products.find((p) => p.id === featuredProductId);
      if (found) return found;
    }

    // Filter products that have a discount
    const discounted = products.filter(
      (p) => p.regular_price && p.regular_price > p.price
    );

    if (discounted.length > 0) {
      // Sort by absolute savings or discount percentage descending
      return [...discounted].sort((a, b) => {
        const discA = (a.regular_price - a.price) / a.regular_price;
        const discB = (b.regular_price - b.price) / b.regular_price;
        return discB - discA;
      })[0];
    }

    // Fallback to first featured product or first product
    return products.find((p) => p.featured) || products[0];
  }, [products, featuredProductId]);

  // Selected image index for featured product
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  // Expiring countdown timer to tonight's midnight (23:59:59)
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeUntilMidnight = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const diff = endOfDay.getTime() - now.getTime();
      if (diff <= 0) {
        return { hours: 23, minutes: 59, seconds: 59 };
      }

      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeUntilMidnight());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!featuredDeal) return null;

  const discountPercent =
    featuredDeal.regular_price > featuredDeal.price
      ? Math.round(
          ((featuredDeal.regular_price - featuredDeal.price) /
            featuredDeal.regular_price) *
            100
        )
      : 25;

  const savingsAmount =
    featuredDeal.regular_price > featuredDeal.price
      ? featuredDeal.regular_price - featuredDeal.price
      : Math.round(featuredDeal.price * 0.25);

  const images =
    featuredDeal.images && featuredDeal.images.length > 0
      ? featuredDeal.images.map((img) => img.src)
      : [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        ];

  const currentDisplayImage = images[selectedImgIdx] || images[0];

  // Stock urgency claim rate (e.g. 84% claimed, 4 left)
  const claimedPercentage = 84;
  const unitsLeft = 4;

  return (
    <section className="max-w-7xl mx-auto px-4 my-3 sm:my-5">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white border border-cyan-500/30 shadow-xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Strip: Deal of the Day Banner & Urgency Countdown Timer */}
        <div className="relative z-10 px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Badge & Title */}
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-white" />
              Daily Deal
            </span>
            <span className="text-sm font-bold text-slate-200">
              Expiring Flash Offer
            </span>
          </div>

          {/* High Urgency Countdown Timer */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ends in:</span>
            </span>

            <div className="flex items-center gap-1">
              <div className="flex flex-col items-center">
                <span className="w-9 h-8 rounded-md bg-slate-800 border border-cyan-500/40 font-mono text-base font-black text-cyan-300 flex items-center justify-center shadow-inner">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5">HRS</span>
              </div>
              <span className="font-bold text-cyan-400 text-sm mb-3">:</span>
              <div className="flex flex-col items-center">
                <span className="w-9 h-8 rounded-md bg-slate-800 border border-cyan-500/40 font-mono text-base font-black text-cyan-300 flex items-center justify-center shadow-inner">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5">MIN</span>
              </div>
              <span className="font-bold text-cyan-400 text-sm mb-3">:</span>
              <div className="flex flex-col items-center">
                <span className="w-9 h-8 rounded-md bg-rose-950/80 border border-rose-500/60 font-mono text-base font-black text-rose-300 flex items-center justify-center shadow-inner animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] text-rose-400 font-medium mt-0.5">SEC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Body: Product Spotlight */}
        <div className="relative z-10 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Clear, High-Resolution Product Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Main Stage Image */}
            <div
              onClick={() => setCurrentView('product', featuredDeal)}
              className="relative w-full max-w-sm aspect-[4/3] rounded-xl bg-white p-4 shadow-lg border border-slate-200/90 flex items-center justify-center group cursor-pointer overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
            >
              {/* Discount Ribbon */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-rose-600 text-white font-black text-xs tracking-wider shadow-md z-10">
                SAVE {discountPercent}%
              </div>

              {/* Verified Stock Badge */}
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-[10px] flex items-center gap-1 z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Kampala Hub
              </div>

              <OptimizedImage
                src={currentDisplayImage}
                alt={featuredDeal.name}
                width={500}
                height={375}
                className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500"
              />

              <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-600" />
                  View Details
                </span>
              </div>
            </div>

            {/* Thumbnail Gallery (if multiple images) */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full pb-1">
                {images.slice(0, 5).map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIdx(idx)}
                    className={`w-11 h-11 rounded-lg bg-white p-1 border cursor-pointer transition-all ${
                      selectedImgIdx === idx
                        ? 'border-cyan-400 ring-2 ring-cyan-400/60 scale-105'
                        : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Angle ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: High Conversion Details & Action */}
          <div className="lg:col-span-7 flex flex-col space-y-3.5">
            {/* Brand & Stock Status */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold text-[10px] uppercase tracking-wider">
                {featuredDeal.brand || 'CDT Official'}
              </span>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Featured Tech Pick
              </span>
            </div>

            {/* Product Title */}
            <h3
              onClick={() => setCurrentView('product', featuredDeal)}
              className="text-lg sm:text-2xl font-black text-white hover:text-cyan-300 transition-colors cursor-pointer leading-tight"
            >
              {featuredDeal.name}
            </h3>

            {/* Product Specs Chips (Clean & Concise) */}
            {featuredDeal.attributes && featuredDeal.attributes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {featuredDeal.attributes.slice(0, 4).map((attr, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-slate-200 text-xs font-medium"
                  >
                    {attr.options[0] || attr.name}
                  </span>
                ))}
              </div>
            )}

            {/* Pricing Section */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatPrice(featuredDeal.price)}
              </span>

              {featuredDeal.regular_price > featuredDeal.price && (
                <span className="text-sm sm:text-base text-slate-400 line-through">
                  {formatPrice(featuredDeal.regular_price)}
                </span>
              )}

              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                You Save {formatPrice(savingsAmount)} ({discountPercent}% OFF)
              </span>
            </div>

            {/* Urgency Stock Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Hurry! Only {unitsLeft} units left at this special price
                </span>
                <span className="text-slate-400">{claimedPercentage}% Claimed</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-full transition-all duration-1000"
                  style={{ width: `${claimedPercentage}%` }}
                />
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>1-Year Tech Warranty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Fast Kampala Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Genuine Hardware</span>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => addToCart(featuredDeal, 1)}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/25 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Claim This Deal</span>
              </button>

              <button
                onClick={() => setCurrentView('product', featuredDeal)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
              >
                <span>View Full Specs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
