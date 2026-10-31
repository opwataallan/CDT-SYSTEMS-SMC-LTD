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
  ChevronLeft,
  Maximize2,
  Play,
  Pause,
  X,
  MapPin,
  Clock,
  HelpCircle,
  Plus,
  Minus,
  Layers,
  Bell,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Product, ProductVariation, PriceDropAlert } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductReviewsSection } from '../components/ProductReviewsSection';
import { DistrictSelector } from '../components/DistrictSelector';
import { getDistrictDeliveryOptions } from '../data/ugandaDistricts';
import { WooCommerceHtml } from '../components/WooCommerceHtml';
import { sanitizeWooCommerceHtml } from '../utils/sanitizeWooCommerceHtml';
import { PriceDropAlertModal } from '../components/PriceDropAlertModal';
import { CdtLogoSpinner } from '../components/CdtLogoSpinner';

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
    user,
    storeSettings,
  } = useShop();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(undefined);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedCategoryName, setRelatedCategoryName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [chosenDistrict, setChosenDistrict] = useState(user?.addresses?.[0]?.district || 'Kampala');
  const [isPriceAlertModalOpen, setIsPriceAlertModalOpen] = useState(false);
  const [userPriceAlert, setUserPriceAlert] = useState<PriceDropAlert | null>(null);

  // Sliding Carousel & Lightbox States
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const districtOptions = getDistrictDeliveryOptions(chosenDistrict);
  const doorstepOpt = districtOptions.find((o) => o.type === 'doorstep') || districtOptions[0];
  const pickupOpt = districtOptions.find((o) => o.type === 'pickup');

  // Automatically slide product pictures when viewed, pausing on hover or user interaction
  useEffect(() => {
    if (!product || !product.images || product.images.length <= 1) return;
    if (!isAutoSliding || isHovered || isLightboxOpen) return;

    const timer = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [product, isAutoSliding, isHovered, isLightboxOpen]);

  // Touch Swipe Handlers for mobile & tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;
    if (isLeftSwipe && product?.images && product.images.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    }
    if (isRightSwipe && product?.images && product.images.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Lightbox keyboard navigation (Esc to close, Arrow keys to slide)
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight' && product?.images?.length) {
        setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
      }
      if (e.key === 'ArrowLeft' && product?.images?.length) {
        setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, product?.images?.length]);

  // Check alert subscription status for current logged-in user
  useEffect(() => {
    if (product?.id && (user?.email || user?.phone)) {
      api
        .getPriceDropAlertStatus(product.id, { email: user?.email, phone: user?.phone })
        .then((res) => {
          if (res.subscribed && res.alert) {
            setUserPriceAlert(res.alert);
          } else {
            setUserPriceAlert(null);
          }
        })
        .catch(() => {});
    }
  }, [product?.id, user?.email, user?.phone]);

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

        // Pull products from the same category to increase cross-selling opportunities
        const primaryCat = p.categories && p.categories.length > 0 ? p.categories[0] : null;
        const catQuery = primaryCat?.slug || (primaryCat?.id ? String(primaryCat.id) : undefined);
        const catName = primaryCat?.name || '';
        setRelatedCategoryName(catName);

        setRelatedLoading(true);
        if (catQuery) {
          api.getProducts({ category: catQuery, limit: 12 })
            .then((res) => {
              if (res && Array.isArray(res.products)) {
                const categoryFiltered = res.products.filter((item) => item && item.id !== p.id);
                if (categoryFiltered.length > 0) {
                  setRelatedProducts(categoryFiltered.slice(0, 6));
                } else {
                  // Fallback to general products if only 1 item in category
                  api.getProducts({ limit: 7 })
                    .then((fallbackRes) => {
                      if (fallbackRes?.products) {
                        setRelatedProducts(fallbackRes.products.filter((item) => item.id !== p.id).slice(0, 6));
                      }
                    })
                    .catch(() => {});
                }
              }
            })
            .catch((err) => {
              console.error('Failed to load related category products:', err);
            })
            .finally(() => setRelatedLoading(false));
        } else {
          // If no category assigned, fetch complementary equipment
          api.getProducts({ limit: 7 })
            .then((res) => {
              if (res && Array.isArray(res.products)) {
                setRelatedProducts(res.products.filter((item) => item && item.id !== p.id).slice(0, 6));
              }
            })
            .catch(() => {})
            .finally(() => setRelatedLoading(false));
        }
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
      })
      .finally(() => setLoading(false));
  }, [slugOrId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
        <CdtLogoSpinner size="lg" variant="brand" className="mb-4" />
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

  const cleanWaNumber = (storeSettings.whatsapp_number || '256779743101').replace(/[^0-9]/g, '');
  const whatsappInquiryUrl = `https://wa.me/${cleanWaNumber}?text=Hello%20Cyber%20Dynamic%20Tech,%20I%20am%20interested%20in%20buying:%20${encodeURIComponent(
    product.name
  )}%20for%20UGX%20${activePrice.toLocaleString()}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-6 pb-28 lg:pb-12">
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
        {/* Left Column: Interactive Product Pictures Sliding Carousel (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div
            className="relative rounded-2xl overflow-hidden bg-white border border-slate-200/80 aspect-square shadow-panel group select-none flex items-center justify-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sliding Carousel Track */}
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
            >
              {(product.images && product.images.length > 0
                ? product.images
                : [{ id: 0, src: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', alt: product.name }]
              ).map((img, idx) => (
                <div
                  key={img.id || idx}
                  className="min-w-full w-full h-full flex-shrink-0 flex items-center justify-center p-3 relative cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Click to view full-resolution preview"
                >
                  <img
                    src={img.src}
                    alt={img.alt || product.name}
                    className="w-full h-full object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-102"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-orange-500 text-white font-black text-[10px] shadow-sm uppercase tracking-wider z-10">
                -{discountPercent}% OFF
              </span>
            )}

            {/* Top Right Actions: Auto-slide toggle & Fullscreen Zoom */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
              {product.images && product.images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAutoSliding(!isAutoSliding);
                  }}
                  title={isAutoSliding ? 'Pause auto-slide' : 'Resume auto-slide'}
                  className={`p-1.5 rounded-full backdrop-blur-md border text-xs transition-all shadow-sm cursor-pointer ${
                    isAutoSliding
                      ? 'bg-white/85 text-emerald-600 border-emerald-200 hover:bg-white'
                      : 'bg-white/85 text-slate-500 border-slate-200 hover:bg-white'
                  }`}
                >
                  {isAutoSliding ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                title="Fullscreen zoom"
                className="p-1.5 rounded-full bg-white/85 hover:bg-white text-slate-700 backdrop-blur-md border border-slate-200 shadow-sm transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Left Chevron Arrow */}
            {product.images && product.images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
                }}
                aria-label="Previous picture"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-panel border border-slate-200/80 flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              </button>
            )}

            {/* Right Chevron Arrow */}
            {product.images && product.images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
                }}
                aria-label="Next picture"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-panel border border-slate-200/80 flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              </button>
            )}

            {/* Bottom Bar: Slide Dot Indicators & Counter Badge */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-3.5 z-10 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-auto">
                  {product.images.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(dotIdx);
                      }}
                      aria-label={`Slide to image ${dotIdx + 1}`}
                      className={`transition-all duration-300 rounded-full h-1.5 cursor-pointer ${
                        selectedImageIndex === dotIdx
                          ? 'w-5 bg-gradient-to-r from-amber-400 to-amber-300 shadow-xs'
                          : 'w-1.5 bg-white/60 hover:bg-white'
                      }`}
                    />
                  ))}
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-sm text-white border border-white/20">
                  {selectedImageIndex + 1} / {product.images.length}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  onMouseEnter={() => setSelectedImageIndex(idx)}
                  aria-label={`Select picture ${idx + 1}`}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer p-0.5 bg-white ${
                    selectedImageIndex === idx
                      ? 'border-[#920d35] ring-2 ring-[#920d35]/30 shadow-panel scale-102'
                      : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                  }`}
                >
                  <img src={img.src} alt={img.alt || product.name} className="w-full h-full object-cover rounded-lg" />
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
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('customer-reviews');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 cursor-pointer group text-left"
          >
            <div className="flex items-center text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-800">{product.average_rating}</span>
            <span className="text-xs text-cyan-600 group-hover:underline font-semibold">
              ({product.rating_count} reviews • View all)
            </span>
          </button>

          {/* Price Box */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
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

              {/* Price Drop Tracker Quick Pill */}
              <button
                type="button"
                id="quick-track-price-pill"
                onClick={() => setIsPriceAlertModalOpen(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border shadow-2xs ${
                  userPriceAlert
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 hover:border-amber-300'
                }`}
                title="Set SMS or Email alert when price drops in WooCommerce"
              >
                <Bell className={`w-3 h-3 ${userPriceAlert ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`} />
                <span>{userPriceAlert ? 'Alert Active' : 'Track Price'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Price includes official Uganda sales taxes & standard warranty.
            </p>
          </div>

          {/* Short Description (WooCommerce Clean Sanitized HTML) */}
          {product.short_description && (
            <div className="py-2.5 border-y border-slate-100/90 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Key Highlights & Summary
              </div>
              <WooCommerceHtml
                html={product.short_description}
                className="text-xs text-slate-600 leading-relaxed font-normal"
              />
            </div>
          )}

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
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer touch-manipulation"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-black text-slate-800 min-w-[32px] text-center">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer touch-manipulation"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer touch-manipulation active:scale-95 ${
                  isInWishlist(product.id)
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-slate-200 text-slate-500 hover:text-red-600 hover:bg-slate-50'
                }`}
                title="Save to Wishlist"
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer touch-manipulation active:scale-95"
                title="Share product link"
                aria-label="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                id="product-add-to-cart-btn"
                onClick={() => addToCart(product, selectedVariation, quantity, selectedAttributes)}
                className="min-h-[42px] py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer touch-manipulation"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                id="product-buy-now-btn"
                onClick={() => buyNow(product, selectedVariation, quantity, selectedAttributes)}
                className="min-h-[42px] py-2.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer touch-manipulation"
              >
                <Zap className="w-4 h-4 fill-white" />
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
              <span>Inquire on WhatsApp</span>
            </a>

            {/* Notify Me When Price Drops Button */}
            <button
              id="notify-me-price-drop-btn"
              type="button"
              onClick={() => setIsPriceAlertModalOpen(true)}
              className={`w-full py-2.5 px-3 rounded-lg font-extrabold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-2xs ${
                userPriceAlert
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300 hover:border-amber-400'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${userPriceAlert ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`} />
              <span>{userPriceAlert ? '✓ Price Drop Alert Active (Tap to Edit)' : 'Notify Me When Price Drops'}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/80 text-slate-700 border border-slate-200/80 shadow-2xs">
                SMS / Email
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Delivery & Warranty Trust Box (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          {/* Marketplace Vendor / Merchant Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-panel space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#920d35] text-white flex items-center justify-center font-bold text-xs">
                  {product.vendor_name ? product.vendor_name[0] : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {product.vendor_name || 'Cyber Dynamic Tech (Main Store)'}
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified Merchant" />
                  </div>
                  <span className="text-[10px] text-slate-500">Verified Marketplace Seller</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-800">{product.average_rating || '4.9'}</span>
                <span className="text-slate-400">({product.rating_count || 12} reviews)</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('storefront', { slug: product.store_slug || 'cyber-dynamic-tech' })}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-[#920d35] hover:text-white text-slate-800 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Visit Storefront →
              </button>
            </div>
          </div>

          {/* Delivery District Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-panel space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                <Truck className="w-3.5 h-3.5 text-cyan-600" />
                <span>Delivery to Your District</span>
              </div>
              <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.2 rounded">
                Individual Rates
              </span>
            </div>

            <div>
              <DistrictSelector
                selectedDistrict={chosenDistrict}
                onSelectDistrict={(name) => {
                  setChosenDistrict(name);
                  const matchedZone = deliveryZones.find((z) =>
                    z.name.toLowerCase().includes(name.toLowerCase()) ||
                    name.toLowerCase().includes(z.name.toLowerCase())
                  );
                  if (matchedZone) {
                    setSelectedZone(matchedZone);
                  }
                }}
                showPickupDetails={false}
                compact={true}
              />
            </div>

            {/* Individualized delivery rates for chosen district */}
            <div className="text-xs space-y-1.5 pt-1 text-slate-600 border-t border-slate-100">
              <div className="flex justify-between items-center text-[11px] p-1.5 rounded bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">Doorstep Courier</span>
                  <span className="text-[10px] text-slate-400">{doorstepOpt.estimated_delivery}</span>
                </div>
                <span className="font-black text-slate-900">
                  {doorstepOpt.fee === 0 ? (
                    <span className="text-emerald-600">FREE</span>
                  ) : (
                    `UGX ${doorstepOpt.fee.toLocaleString()}`
                  )}
                </span>
              </div>

              {pickupOpt && (
                <div className="flex justify-between items-center text-[11px] p-1.5 rounded bg-emerald-50/70 border border-emerald-200/60">
                  <div className="truncate pr-1">
                    <span className="font-bold text-emerald-950 block truncate">
                      {pickupOpt.hubLocation?.hubName || 'District Pickup Station'}
                    </span>
                    <span className="text-[10px] text-emerald-700 truncate block">
                      {pickupOpt.hubLocation?.stationAddress || 'Main Town Courier Desk'}
                    </span>
                  </div>
                  <span className="font-black text-emerald-700 text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                    FREE (UGX 0)
                  </span>
                </div>
              )}

              <div className="text-[10px] text-slate-400 pt-0.5 flex items-center justify-between">
                <span>Direct delivery from Central Hub.</span>
                <span className="text-cyan-600 font-semibold">Trackable</span>
              </div>
            </div>
          </div>

          {/* Warranty & Guarantees */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-panel space-y-2 text-xs">
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
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wide flex items-center justify-between">
            <span>Technical Specifications & Description</span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              SKU: {product.sku}
            </span>
          </h3>
          <div className="pt-3">
            <WooCommerceHtml
              html={product.description}
              className="text-xs text-slate-600 leading-relaxed"
              fallback={
                <p className="text-xs text-slate-400 italic">
                  No detailed description provided for this product.
                </p>
              }
            />
          </div>
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

      {/* 4. VERIFIED CUSTOMER REVIEWS & RATINGS */}
      <ProductReviewsSection
        productId={product.id}
        productName={product.name}
        initialRating={product.average_rating}
        initialRatingCount={product.rating_count}
      />

      {/* 5. RELATED PRODUCTS CROSS-SELLING SECTION */}
      <div id="related-products-section" className="space-y-3 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200/80 shrink-0">
              <Layers className="w-4 h-4 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span>Related Products</span>
                {relatedCategoryName && (
                  <span className="text-[10px] normal-case font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                    {relatedCategoryName}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Complementary hardware and accessories from the same category
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const catSlug = product.categories?.[0]?.slug;
              if (catSlug) {
                setCurrentView('shop', { category: catSlug });
              } else {
                setCurrentView('shop');
              }
            }}
            className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer group"
          >
            <span>View All in {relatedCategoryName || 'Category'}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {relatedLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-2 border border-slate-200 animate-pulse h-48 flex flex-col justify-between"
              >
                <div className="w-full h-24 bg-slate-100 rounded" />
                <div className="space-y-1 mt-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-200">
            No related products found in this category at this time.
          </div>
        )}
      </div>

      {/* 5. MOBILE STICKY BUY BAR (Fixed cleanly above BottomNav on mobile with safe-area spacing) */}
      <aside aria-label="Quick Purchase Actions" className="lg:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-lg flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={product.images[0]?.src || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=120'}
            alt={product.name}
            className="w-9 h-9 rounded-md object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 font-semibold line-clamp-1">{product.name}</div>
            <div className="text-sm font-black text-cyan-600 whitespace-nowrap">
              UGX {activePrice.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile Price Drop Alert Quick Button */}
          <button
            type="button"
            id="mobile-track-price-btn"
            onClick={() => setIsPriceAlertModalOpen(true)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer touch-manipulation active:scale-95 ${
              userPriceAlert
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-amber-300 bg-amber-50 text-amber-800'
            }`}
            title="Price Drop Alert"
            aria-label="Price Drop Alert"
          >
            <Bell className={`w-4 h-4 ${userPriceAlert ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`} />
          </button>

          <button
            type="button"
            onClick={() => addToCart(product, selectedVariation, quantity, selectedAttributes)}
            className="min-h-[38px] px-2.5 sm:px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer touch-manipulation active:scale-95 whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
            <span>Add</span>
          </button>

          <button
            type="button"
            onClick={() => buyNow(product, selectedVariation, quantity, selectedAttributes)}
            className="min-h-[38px] px-3 sm:px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-2xs transition-all cursor-pointer touch-manipulation active:scale-95 whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
            <span>Buy Now</span>
          </button>
        </div>
      </aside>

      {/* 6. PRICE DROP ALERT SUBSCRIPTION MODAL */}
      {isPriceAlertModalOpen && product && (
        <PriceDropAlertModal
          product={product}
          isOpen={isPriceAlertModalOpen}
          onClose={() => setIsPriceAlertModalOpen(false)}
          userEmail={user?.email}
          userPhone={user?.phone}
          onAlertUpdated={(alert) => {
            setUserPriceAlert(alert);
            if (alert) {
              showToast('Price drop alert configured successfully!', 'success');
            } else {
              showToast('Price drop alert removed.', 'info');
            }
          }}
        />
      )}
      {/* 7. FULLSCREEN PRODUCT PICTURE LIGHTBOX MODAL */}
      {isLightboxOpen && product && product.images && product.images.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0 pr-4">
              <h4 className="text-sm sm:text-base font-black truncate">{product.name}</h4>
              <p className="text-xs text-slate-400">
                Image {selectedImageIndex + 1} of {product.images.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close fullscreen view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Main Zoom View */}
          <div className="relative flex-1 w-full max-w-4xl flex items-center justify-center my-auto p-2" onClick={(e) => e.stopPropagation()}>
            {product.images.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
                aria-label="Previous picture"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="w-full h-full max-h-[70vh] flex items-center justify-center overflow-hidden">
              <img
                src={product.images[selectedImageIndex]?.src}
                alt={product.images[selectedImageIndex]?.alt || product.name}
                className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-300 drop-shadow-2xl"
              />
            </div>

            {product.images.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedImageIndex((prev) => (prev + 1) % product.images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer"
                aria-label="Next picture"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {product.images.length > 1 && (
            <div className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2" onClick={(e) => e.stopPropagation()}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer p-0.5 ${
                    selectedImageIndex === idx ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105' : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.src} alt={img.alt || ''} className="w-full h-full object-cover rounded" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
