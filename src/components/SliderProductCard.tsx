import React, { useState } from 'react';
import { ShoppingCart, Eye, Check, Star, ShieldCheck, Heart } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { OptimizedImage } from './OptimizedImage';

interface SliderProductCardProps {
  product: Product;
  onCardClick?: (product: Product) => void;
  isDraggingRef?: React.MutableRefObject<boolean>;
}

export const SliderProductCard: React.FC<SliderProductCardProps> = ({
  product,
  onCardClick,
  isDraggingRef,
}) => {
  const { addToCart, isInWishlist, toggleWishlist, setCurrentView } = useShop();
  const [justAdded, setJustAdded] = useState(false);

  const isFavorited = isInWishlist(product.id);
  const discountPercent =
    product.regular_price > product.price
      ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100)
      : 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Suppress click if the user was actively dragging
    if (isDraggingRef?.current) {
      e.preventDefault();
      return;
    }
    if (onCardClick) {
      onCardClick(product);
    } else {
      setCurrentView('product', { slug: product.slug, id: product.id });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef?.current) return;
    addToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef?.current) return;
    setCurrentView('product', { slug: product.slug, id: product.id });
  };

  const rawImg = product.images?.[0]?.src || (product as any).image;
  const primaryImage =
    rawImg
      ? (rawImg.startsWith('http://') && rawImg.includes('cyberdynamictech.com')
          ? rawImg.replace('http://', 'https://')
          : rawImg)
      : 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80';

  return (
    <div
      id={`slider-product-card-${product.id}`}
      onClick={handleCardClick}
      className="group relative flex-shrink-0 w-[calc((100vw-44px)/2)] sm:w-[calc((100vw-88px)/4)] md:w-[calc((100vw-110px)/5)] lg:w-[calc((min(100vw,1280px)-112px)/6)] xl:w-[calc((1280px-112px)/6)] min-w-[140px] max-w-[210px] bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-slate-200 shadow-2xs hover:shadow-md hover:border-cyan-500 transition-all duration-300 flex flex-col select-none cursor-pointer"
    >
      {/* Top Floating Badges */}
      <div className="absolute top-1.5 left-1.5 right-1.5 sm:top-2 sm:left-2 sm:right-2 flex items-center justify-between z-10 pointer-events-none">
        <div>
          {discountPercent > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[8px] sm:text-[9px] shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isDraggingRef?.current) return;
            toggleWishlist(product.id);
          }}
          className={`pointer-events-auto w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full backdrop-blur-md transition-transform duration-200 hover:scale-110 active:scale-90 touch-manipulation shadow-xs ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-white/90 text-slate-400 hover:text-rose-500 border border-slate-100'
          }`}
          title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Image with Aspect Ratio and Lazy Loading */}
      <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-white mb-1.5 border border-slate-100 flex items-center justify-center">
        <OptimizedImage
          src={primaryImage}
          alt={product.name}
          width={400}
          height={300}
          draggable={false}
          containerClassName="w-full h-full"
          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {/* Quick View Overlay Button on Desktop Hover */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center justify-center pointer-events-none">
          <button
            type="button"
            onClick={handleQuickView}
            className="pointer-events-auto px-2.5 py-1 rounded-full bg-white/95 hover:bg-white text-slate-800 text-[10px] font-bold shadow-md flex items-center gap-1 transition-transform transform translate-y-2 group-hover:translate-y-0"
          >
            <Eye className="w-3 h-3 text-cyan-600" />
            <span>View</span>
          </button>
        </div>
      </div>

      {/* Brand & Stock Status */}
      <div className="flex items-center justify-between gap-1 text-[9px] text-slate-500 mb-0.5">
        <span className="font-semibold uppercase tracking-wider truncate text-slate-600">
          {product.brand || 'CDT'}
        </span>
        <span className="flex items-center gap-1 font-medium text-emerald-600 text-[9px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          In Stock
        </span>
      </div>

      {/* Product Name */}
      <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight group-hover:text-cyan-600 transition-colors mb-1">
        {product.name}
      </h3>

      {/* Pricing and Action Buttons */}
      <div className="mt-auto pt-1 border-t border-slate-100 flex items-center justify-between gap-1">
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-xs font-bold text-slate-900 tracking-tight whitespace-nowrap">
            UGX {product.price.toLocaleString()}
          </span>
          {product.regular_price > product.price && (
            <span className="text-[9px] text-slate-400 line-through whitespace-nowrap">
              UGX {product.regular_price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className={`py-1 px-2 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer shrink-0 ${
            justAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-2xs'
          }`}
          title="Add to Cart"
        >
          {justAdded ? (
            <Check className="w-3 h-3 text-white" />
          ) : (
            <ShoppingCart className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
};
