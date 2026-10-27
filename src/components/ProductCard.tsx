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

  const rawImage = product.images?.[0]?.src || (product as any).image;
  const primaryImage = rawImage
    ? (rawImage.startsWith('http://') && rawImage.includes('cyberdynamictech.com')
        ? rawImage.replace('http://', 'https://')
        : rawImage)
    : 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80';

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative flex flex-col bg-white/95 rounded-lg p-1.5 sm:p-2 border border-slate-200/90 shadow-2xs hover:border-cyan-500 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Badges and Wishlist Button Overlay */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
        <div>
          {discountPercent > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold text-[9px] shadow-2xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`pointer-events-auto min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-150 shadow-2xs active:scale-90 ${
            isFavorited
              ? 'bg-rose-50 text-rose-600'
              : 'bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500'
          }`}
          aria-label="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Image Container */}
      <div className="relative w-full aspect-[4/3] bg-white rounded-md overflow-hidden mb-2 flex items-center justify-center border border-slate-100/90 shadow-2xs">
        <OptimizedImage
          src={primaryImage}
          alt={product.images?.[0]?.alt || product.name}
          width={360}
          height={270}
          containerClassName="w-full h-full"
          className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Details Content */}
      <div className="flex flex-col flex-1">
        {/* Brand & Stock Dot */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1">
          <span className="uppercase tracking-wider font-semibold text-slate-600 truncate">
            {product.brand || 'CDT'}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            In Stock
          </span>
        </div>

        {/* Product Name */}
        <h3 className="text-xs font-semibold leading-snug text-slate-900 group-hover:text-cyan-600 transition-colors line-clamp-2 mb-1.5">
          {product.name}
        </h3>

        {/* Price Row */}
        <div className="mt-auto pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              UGX {product.price.toLocaleString()}
            </span>
            {product.regular_price > product.price && (
              <span className="text-[10px] text-slate-400 line-through whitespace-nowrap">
                UGX {product.regular_price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Quick Action Button with Thumb-Friendly Hit Area */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="min-h-[34px] px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0 touch-manipulation"
            title="Add to Cart"
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
