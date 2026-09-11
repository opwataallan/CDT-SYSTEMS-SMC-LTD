import React from 'react';
import { Star, ShoppingCart, Heart, Zap, ShieldCheck } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';

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
      className="group relative flex flex-col bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200 shadow-xs hover:border-cyan-500 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Badges and Wishlist Button Overlay */}
      <div className="absolute top-4.5 left-4.5 right-4.5 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
          {discountPercent > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-red-500 text-white font-bold text-[9px] shadow-2xs">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-white font-bold text-[9px] uppercase tracking-wider shadow-2xs">
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
          className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-sm transition-all duration-150 shadow-2xs ${
            isFavorited
              ? 'bg-orange-50 text-orange-600'
              : 'bg-white/90 hover:bg-white text-slate-400 hover:text-orange-500'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-orange-500 text-orange-500' : ''}`} />
        </button>
      </div>

      {/* Product Image Container (High Density Compact Aspect Ratio) */}
      <div className="relative w-full pt-[75%] bg-slate-100 rounded overflow-hidden mb-2 flex items-center justify-center">
        <img
          src={product.images[0]?.src}
          alt={product.images[0]?.alt || product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Details Content */}
      <div className="flex flex-col flex-1">
        {/* Brand Category & Stock Indicator */}
        <div className="flex items-center justify-between gap-1 text-[10px] font-bold mb-0.5">
          <span className="text-slate-400 uppercase tracking-wider">{product.brand}</span>
          <span
            className={`font-semibold flex items-center gap-1 ${
              product.stock_status === 'instock' ? 'text-emerald-600' : 'text-orange-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                product.stock_status === 'instock' ? 'bg-emerald-500' : 'bg-orange-500'
              }`}
            />
            {product.stock_status === 'instock' ? 'In Stock' : 'Low Stock'}
          </span>
        </div>

        {/* Product Title (High Density 13px font bold) */}
        <h3 className="text-[13px] font-bold leading-tight mb-1 text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
          {product.name}
        </h3>

        {/* Rating Stars & Count (Orange Stars) */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center text-orange-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.average_rating) ? 'fill-orange-400' : 'text-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-700">{product.average_rating}</span>
          <span className="text-[10px] text-slate-400">({product.rating_count})</span>
        </div>

        {/* Price Row (Cyan Accent Price) */}
        <div className="mt-auto pt-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5 leading-tight">
            <span className="text-xs sm:text-sm font-black text-cyan-600 tracking-tight whitespace-nowrap">
              UGX {product.price.toLocaleString()}
            </span>
            {product.regular_price > product.price && (
              <span className="text-[10px] text-slate-400 line-through whitespace-nowrap">
                UGX {product.regular_price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Quick Action Buttons (High Density Compact Sizing) */}
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5 mt-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="py-1 sm:py-1.5 px-1.5 sm:px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShoppingCart className="w-3 h-3 shrink-0" />
              <span>Add</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                buyNow(product);
              }}
              className="py-1 sm:py-1.5 px-1.5 sm:px-2 rounded bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <Zap className="w-3 h-3 fill-white shrink-0" />
              <span>Buy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
