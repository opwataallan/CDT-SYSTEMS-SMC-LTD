import React, { useState } from 'react';
import { ShoppingCart, Eye, Check, Star, ShieldCheck, Heart } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';

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
      className="group relative flex-shrink-0 w-[190px] sm:w-[225px] md:w-[255px] lg:w-[270px] bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:shadow-lg hover:border-cyan-500 transition-all duration-300 flex flex-col select-none cursor-pointer"
    >
      {/* Top Floating Badges */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex flex-col gap-1 items-start">
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
              -{discountPercent}% OFF
            </span>
          )}
          {product.featured && (
            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[9px] uppercase tracking-wider shadow-xs">
              Top Pick
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
          className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-md transition-transform duration-200 hover:scale-110 shadow-xs ${
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
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-50 mb-2.5 border border-slate-100 flex items-center justify-center">
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          draggable={false}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {/* Quick View Overlay Button on Desktop Hover */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <button
            type="button"
            onClick={handleQuickView}
            className="pointer-events-auto px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-800 text-[11px] font-bold shadow-md flex items-center gap-1.5 transition-transform transform translate-y-2 group-hover:translate-y-0"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-600" />
            <span>View Product</span>
          </button>
        </div>
      </div>

      {/* Brand & Stock Status */}
      <div className="flex items-center justify-between gap-1 text-[10px] font-bold mb-1">
        <span className="text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
          {product.brand || 'CDT TECH'}
        </span>
        <span
          className={`flex items-center gap-1 font-semibold ${
            product.stock_status === 'instock' ? 'text-emerald-700' : 'text-amber-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              product.stock_status === 'instock' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          {product.stock_status === 'instock' ? 'In Stock' : 'Low Stock'}
        </span>
      </div>

      {/* Product Name (2 Lines Clamped) */}
      <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-cyan-600 transition-colors mb-1 min-h-[2.5rem]">
        {product.name}
      </h3>

      {/* Short Specification Snippet */}
      <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
        {product.short_description || 'Tested & Certified authentic tech hardware with warranty'}
      </p>

      {/* Ratings & Reviews */}
      <div className="flex items-center gap-1 mb-2">
        <div className="flex items-center text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < Math.floor(product.average_rating || 4.8) ? 'fill-amber-400' : 'text-slate-200'
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold text-slate-700">
          {(product.average_rating || 4.8).toFixed(1)}
        </span>
        <span className="text-[9px] text-slate-400">({product.rating_count || 24})</span>
      </div>

      {/* Pricing and Action Buttons */}
      <div className="mt-auto pt-2 border-t border-slate-100 flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
            USh {product.price.toLocaleString()}
          </span>
          {product.regular_price > product.price && (
            <span className="text-[10px] text-slate-400 line-through">
              USh {product.regular_price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Buttons: Add to Cart and View */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-cyan-600 text-white shadow-2xs'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleQuickView}
            className="py-1.5 px-2 rounded-lg text-[11px] font-bold border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
