import React from 'react';
import { Star, ShoppingCart, Heart, Zap, ShieldCheck } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { OptimizedImage } from './OptimizedImage';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'compact' | 'horizontal';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, variant = 'grid' }) => {
  const { addToCart, buyNow, toggleWishlist, isInWishlist, setCurrentView } = useShop();

  const isFavorited = isInWishlist(product.id);
  const discountPercent =
    product.regular_price > product.price
      ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100)
      : 0;

  const handleCardClick = () => {
    setCurrentView('product', { slug: product.slug, id: product.id });
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative flex flex-col bg-white/95 rounded-lg p-1.5 sm:p-2 border border-slate-200/90 shadow-2xs hover:border-cyan-500 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Badges and Wishlist Button Overlay */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex flex-col gap-0.5 sm:gap-1 items-start">
          {discountPercent > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-red-500 text-white font-bold text-[8.5px] sm:text-[9px] shadow-2xs">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="hidden xs:inline-block px-1.5 py-0.5 rounded bg-cyan-500 text-white font-bold text-[8.5px] sm:text-[9px] uppercase tracking-wider shadow-2xs">
              Top Pick
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`pointer-events-auto p-1 sm:p-1.5 rounded-full backdrop-blur-sm transition-all duration-150 shadow-2xs ${
            isFavorited
              ? 'bg-orange-50 text-orange-600'
              : 'bg-white/90 hover:bg-white text-slate-400 hover:text-orange-500'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isFavorited ? 'fill-orange-500 text-orange-500' : ''}`} />
        </button>
      </div>

      {/* Product Image Container (High Density Compact Aspect Ratio) */}
      <div className="relative w-full pt-[78%] bg-slate-100 rounded overflow-hidden mb-1 flex items-center justify-center">
        <OptimizedImage
          src={product.images[0]?.src}
          alt={product.images[0]?.alt || product.name}
          width={320}
          height={250}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Details Content */}
      <div className="flex flex-col flex-1">
        {/* Brand Category & Stock Indicator */}
        <div className="flex items-center justify-between gap-1 text-[9px] sm:text-[10px] font-bold mb-1">
          <span className="text-cyan-700 bg-cyan-50/90 px-1 py-0.5 rounded font-mono uppercase tracking-wider truncate max-w-[65%]">
            {product.brand || 'CDT'}
          </span>
          <span
            className={`font-semibold flex items-center gap-0.5 text-[8.5px] sm:text-[9.5px] ${
              product.stock_status === 'instock' ? 'text-emerald-600' : 'text-orange-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                product.stock_status === 'instock' ? 'bg-emerald-500' : 'bg-orange-500'
              }`}
            />
            <span className="hidden xs:inline">{product.stock_status === 'instock' ? 'Stock' : 'Low'}</span>
          </span>
        </div>

        {/* Product Name Card Container - Distinctive matching color & gradient */}
        <div className="product-name-box rounded px-1.5 py-1 mb-1 transition-all">
          <h3 className="text-[10px] xs:text-[11px] sm:text-xs font-bold leading-snug text-slate-900 group-hover:text-cyan-900 transition-colors line-clamp-2 min-h-[1.6rem] sm:min-h-[1.9rem]">
            {product.name}
          </h3>
        </div>

        {/* Rating Stars & Count */}
        <div className="flex items-center gap-1 mb-1">
          <div className="flex items-center text-orange-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${
                  i < Math.floor(product.average_rating) ? 'fill-orange-400 text-orange-400' : 'text-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-700">{product.average_rating}</span>
          <span className="text-[8.5px] sm:text-[9.5px] text-slate-400 hidden xs:inline">({product.rating_count})</span>
        </div>

        {/* Price Row (Cyan Accent Price) */}
        <div className="mt-auto pt-0.5 min-w-0">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-black text-cyan-600 tracking-tight whitespace-nowrap">
              UGX {product.price.toLocaleString()}
            </span>
            {product.regular_price > product.price && (
              <span className="text-[8.5px] sm:text-[9.5px] text-slate-400 line-through whitespace-nowrap hidden xs:inline">
                UGX {product.regular_price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Quick Action Buttons (High Density Compact Sizing) */}
          <div className="grid grid-cols-2 gap-1 mt-1 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="py-1 px-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-0.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
              <span className="truncate">Add</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                buyNow(product);
              }}
              className="py-1 px-1 rounded bg-cyan-500 hover:bg-cyan-600 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-0.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <Zap className="w-2.5 h-2.5 fill-white shrink-0" />
              <span className="truncate">Buy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
