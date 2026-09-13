import React, { useState, useEffect } from 'react';
import {
  Star,
  ShoppingCart,
  Zap,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
  Share2,
  Phone,
  MessageCircle,
  ChevronRight,
  MapPin,
  Clock,
  HelpCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Product, ProductVariation } from '../types';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailPageProps {
  slugOrId: string | number;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slugOrId }) => {
  const {
    addToCart,
    buyNow,
    toggleWishlist,
    isInWishlist,
    setCurrentView,
    deliveryZones,
    selectedZone,
    setSelectedZone,
    addToRecentlyViewed,
    showToast,
  } = useShop();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(undefined);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Load product
  useEffect(() => {
    setLoading(true);
    api.getProduct(slugOrId)
      .then((p) => {
        setProduct(p);
        addToRecentlyViewed(p);
        if (p.variations && p.variations.length > 0) {
          setSelectedVariation(p.variations[0]);
          setSelectedAttributes(p.variations[0].attributes || {});
        }
        // Load related items in same category
        if (p?.categories && Array.isArray(p.categories) && p.categories[0]?.slug) {
          api.getProducts({ category: p.categories[0].slug, limit: 4 })
            .then((res) => {
              if (res && Array.isArray(res.products)) {
                setRelatedProducts(res.products.filter((item) => item && item.id !== p.id));
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
      })
      .finally(() => setLoading(false));
  }, [slugOrId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-700">Loading hardware specifications...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-lg font-black text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500">The requested equipment may be discontinued or out of stock.</p>
        <button
          onClick={() => setCurrentView('shop')}
          className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-lg cursor-pointer"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const activePrice = selectedVariation ? selectedVariation.price : product.price;
  const activeRegularPrice = selectedVariation?.regular_price || product.regular_price;
  const discountPercent =
    activeRegularPrice > activePrice
      ? Math.round(((activeRegularPrice - activePrice) / activeRegularPrice) * 100)
      : 0;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard!');
    }
  };

  const whatsappInquiryUrl = `https://wa.me/256779743101?text=Hello%20Cyber%20Dynamic%20Tech,%20I%20am%20interested%20in%20buying:%20${encodeURIComponent(
    product.name
  )}%20for%20UGX%20${activePrice.toLocaleString()}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* 1. BREADCRUMBS */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 overflow-x-auto whitespace-nowrap pb-0.5">
        <button onClick={() => setCurrentView('home')} className="hover:text-cyan-600 transition-colors">
          Home
        </button>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <button onClick={() => setCurrentView('shop')} className="hover:text-cyan-600 transition-colors">
          Products
        </button>
        {product.categories[0] && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <button
              onClick={() => setCurrentView('category', { slug: product.categories[0].slug, name: product.categories[0].name })}
              className="hover:text-cyan-600 transition-colors"
            >
              {product.categories[0].name}
            </button>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-800 line-clamp-1 max-w-xs">{product.name}</span>
      </div>

      {/* 2. MAIN PRODUCT DETAIL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="relative rounded-lg overflow-hidden bg-slate-50 border border-slate-200 aspect-square shadow-2xs">
            <img
              src={product.images[selectedImageIndex]?.src || product.images[0]?.src}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discountPercent > 0 && (
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-orange-500 text-white font-black text-[10px] shadow-2xs uppercase tracking-wider">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-2xs'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.src} alt={img.alt || product.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center Column: Product Specs & Options (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Brand & Stock Status */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Brand: <strong className="text-slate-900">{product.brand}</strong> | SKU: {product.sku}
            </span>
            <span
              className={`text-[11px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 ${
                product.stock_status === 'instock'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  product.stock_status === 'instock' ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              />
              {product.stock_status === 'instock'
                ? `In Stock (${product.stock_quantity})`
                : 'Limited Quantity'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.average_rating) ? 'fill-amber-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-800">{product.average_rating}</span>
            <span className="text-xs text-slate-400">({product.rating_count} reviews)</span>
          </div>

          {/* Price Box */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-2.5">
              <span className="text-xl sm:text-2xl font-black text-cyan-600 tracking-tight whitespace-nowrap">
                UGX {activePrice.toLocaleString()}
              </span>
              {activeRegularPrice > activePrice && (
                <span className="text-xs sm:text-sm text-slate-400 line-through whitespace-nowrap">
                  UGX {activeRegularPrice.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              Price includes official Uganda sales taxes & standard warranty.
            </p>
          </div>

          {/* Variations Selector if available */}
          {product.variations && product.variations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Select Configuration / Spec:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {product.variations.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariation(v);
                      setSelectedAttributes(v.attributes || {});
                    }}
                    className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      selectedVariation?.id === v.id
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-800 font-bold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="font-semibold line-clamp-1">{v.name}</div>
                    <div className="text-[10px] text-cyan-600 font-bold mt-0.5">
                      UGX {v.price.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-3 text-xs font-black text-slate-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  isInWishlist(product.id)
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-slate-200 text-slate-500 hover:text-red-600 hover:bg-slate-50'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-600' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Share product link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                id="product-add-to-cart-btn"
                onClick={() => addToCart(product, selectedVariation, quantity, selectedAttributes)}
                className="py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>

              <button
                id="product-buy-now-btn"
                onClick={() => buyNow(product, selectedVariation, quantity, selectedAttributes)}
                className="py-2.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Buy Now</span>
              </button>
            </div>

            {/* WhatsApp Direct Contact Button */}
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inquire on WhatsApp (+256 779 743 101)</span>
            </a>
          </div>
        </div>

        {/* Right Column: Delivery & Warranty Trust Box (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          {/* Delivery Zone Selector */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-1.5">
              <Truck className="w-3.5 h-3.5 text-cyan-600" />
              <span>Uganda Delivery Estimate</span>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                Your Delivery District:
              </label>
              <select
                value={selectedZone.id}
                onChange={(e) => {
                  const z = deliveryZones.find((dz) => dz.id === e.target.value);
                  if (z) setSelectedZone(z);
                }}
                className="w-full p-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden"
              >
                {deliveryZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs space-y-1 pt-0.5 text-slate-600">
              <div className="flex justify-between text-[11px]">
                <span>Shipping Fee:</span>
                <span className="font-bold text-slate-900">
                  {selectedZone.fee === 0 ? <span className="text-emerald-600">FREE</span> : `UGX ${selectedZone.fee.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Estimated Arrival:</span>
                <span className="font-bold text-slate-900">{selectedZone.estimated_delivery || selectedZone.estimated_days}</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-0.5">
                Dispatched from Cyber Dynamic Tech hub, Kampala.
              </div>
            </div>
          </div>

          {/* Warranty & Guarantees */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-extrabold text-slate-800 border-b border-slate-100 pb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span>Cyber Dynamic Guarantee</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-1.5 text-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-[11px]">
                  <strong>100% Authentic:</strong> Brand new genuine equipment.
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-700">
                <RotateCcw className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-[11px]">
                  <strong>7-Day Replacement:</strong> Instant replacement for defects.
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-700">
                <Clock className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-[11px]">
                  <strong>12-Month Warranty:</strong> Local technical support in Uganda.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TECHNICAL SPECIFICATIONS & DESCRIPTION TABS */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wide">
            Technical Specifications & Description
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed pt-2">
            {product.description}
          </p>
        </div>

        {product.attributes && product.attributes.length > 0 && (
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
              Hardware Attribute Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
              {product.attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <span className="font-bold text-slate-600">{attr.name}:</span>
                  <span className="text-slate-900 font-semibold">{attr.options.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. RELATED HARDWARE RECOMMENDATIONS */}
      {relatedProducts.length > 0 && (
        <div className="space-y-3 pb-8">
          <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
            Customers Who Viewed This Also Bought
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* 5. MOBILE STICKY BUY BAR (Fixed above BottomNav on mobile) */}
      <div className="lg:hidden fixed bottom-13 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unit Price</div>
          <div className="text-sm font-black text-cyan-600 whitespace-nowrap">
            UGX {activePrice.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => addToCart(product, selectedVariation, quantity, selectedAttributes)}
            className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
            <span>Add</span>
          </button>

          <button
            onClick={() => buyNow(product, selectedVariation, quantity, selectedAttributes)}
            className="py-2 px-3.5 sm:px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
