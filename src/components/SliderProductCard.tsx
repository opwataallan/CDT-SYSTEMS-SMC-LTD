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

  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0].src
      : 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80';

  return (
    <div
      id={`slider-product-card-${product.id}`}
      onClick={handleCardClick}
      className="group relative flex-shrink-0 w-[calc((100vw-68px)/3)] sm:w-[calc((100vw-88px)/4)] md:w-[calc((100vw-110px)/5)] lg:w-[calc((min(100vw,1280px)-112px)/6)] xl:w-[calc((1280px-112px)/6)] min-w-[96px] max-w-[210px] bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-slate-200 shadow-2xs hover:shadow-md hover:border-cyan-500 transition-all duration-300 flex flex-col select-none cursor-pointer"
    >
      {/* Top Floating Badges */}
      <div className="absolute top-1.5 left-1.5 right-1.5 sm:top-2 sm:left-2 sm:right-2 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex flex-col gap-0.5 sm:gap-1 items-start">
          {discountPercent > 0 && (
            <span className="px-1 sm:px-1.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[8px] sm:text-[10px] uppercase tracking-wider shadow-xs">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="hidden xs:inline-block px-1 sm:px-1.5 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[7px] sm:text-[9px] uppercase tracking-wider shadow-xs">
              Top
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
          className={`pointer-events-auto p-1 sm:p-1.5 rounded-full backdrop-blur-md transition-transform duration-200 hover:scale-110 shadow-xs ${
            isFavorited
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-white/90 text-slate-400 hover:text-rose-500 border border-slate-100'
          }`}
          title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label="Wishlist"
        >
          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Image with Aspect Ratio and Lazy Loading */}
      <div className="relative w-full aspect-[4/3] rounded-md sm:rounded-lg overflow-hidden bg-slate-50 mb-1 sm:mb-1.5 border border-slate-100 flex items-center justify-center">
        <OptimizedImage
          src={primaryImage}
          alt={product.name}
          width={400}
          height={300}
          draggable={false}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
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
      <div className="flex items-center justify-between gap-1 text-[8px] sm:text-[10px] font-bold mb-0.5">
        <span className="text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded font-mono uppercase tracking-wider truncate max-w-[55px] sm:max-w-none">
          {product.brand || 'CDT'}
        </span>
        <span
          className={`flex items-center gap-1 font-semibold whitespace-nowrap ${
            product.stock_status === 'instock' ? 'text-emerald-700' : 'text-amber-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              product.stock_status === 'instock' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="hidden xs:inline">{product.stock_status === 'instock' ? 'In Stock' : 'Low'}</span>
        </span>
      </div>

      {/* Product Name (Distinct Matching Card Box) */}
      <div className="product-name-box rounded px-1.5 py-1 mb-1 transition-all">
        <h3 className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-cyan-900 transition-colors min-h-[1.5rem] sm:min-h-[2.05rem]">
          {product.name}
        </h3>
      </div>

      {/* Ratings & Reviews */}
      <div className="flex items-center gap-1 mb-1">
        <div className="flex items-center text-amber-400">
          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
        </div>
        <span className="text-[9px] sm:text-[10px] font-bold text-slate-700">
          {(product.average_rating || 4.8).toFixed(1)}
        </span>
        <span className="hidden sm:inline text-[9px] text-slate-400">({product.rating_count || 24})</span>
      </div>

      {/* Pricing and Action Buttons */}
      <div className="mt-auto pt-1 sm:pt-1.5 border-t border-slate-100 flex flex-col gap-1 sm:gap-1.5">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5">
          <span className="text-[10px] sm:text-xs md:text-sm font-black text-slate-900 tracking-tight leading-none">
            USh {product.price.toLocaleString()}
          </span>
          {product.regular_price > product.price && (
            <span className="text-[8px] sm:text-[10px] text-slate-400 line-through leading-none">
              USh {product.regular_price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Buttons: Add to Cart and View */}
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`py-1 sm:py-1 px-1 sm:px-1.5 rounded text-[9px] sm:text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-cyan-600 text-white shadow-2xs'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3 h-3 text-white shrink-0" />
                <span className="truncate">Done</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3 h-3 shrink-0" />
                <span className="truncate">Add</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleQuickView}
            className="py-1 sm:py-1 px-1 sm:px-1.5 rounded text-[9px] sm:text-[10.5px] font-bold border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
          >
            <span className="truncate">Info</span>
          </button>
        </div>
      </div>
    </div>
  );
};
