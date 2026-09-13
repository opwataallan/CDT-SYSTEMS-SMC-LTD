import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  Laptop,
  Printer,
  Wifi,
  Smartphone,
  Tv,
  MousePointer,
  ChevronRight,
  ChevronLeft,
  Clock,
  Star,
  MapPin,
  Flame,
  CheckCircle2,
  SlidersHorizontal,
  ShoppingCart,
  PackageCheck,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { FiveRowProductSlider } from '../components/FiveRowProductSlider';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Product, Category, HeroBanner } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_HERO_BANNERS } from '../data/cyberCatalog';

export const HomePage: React.FC = () => {
  const { setCurrentView, products: shopProducts, categories: shopCategories, addToCart, formatPrice } = useShop();

  const [products, setProducts] = useState<Product[]>(() => (shopProducts && shopProducts.length > 0 ? shopProducts : INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => (shopCategories && shopCategories.length > 0 ? shopCategories : INITIAL_CATEGORIES));
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(() => INITIAL_HERO_BANNERS);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'laptops' | 'printers' | 'networking'>('all');

  // Category Manual Slider ref & scroll tracking
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Flash Sale Countdown (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 34, seconds: 22 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial catalog data from live API (up to 5,000 products)
  useEffect(() => {
    api.getProducts({ limit: 5000 }).then((res) => {
      if (res && Array.isArray(res.products) && res.products.length > 0) {
        setProducts(res.products);
      }
    }).catch(console.error);
    api.getCategories().then((cats) => {
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
      }
    }).catch(console.error);
    api.getAdminSettings().then((data) => {
      if (data?.heroBanners && Array.isArray(data.heroBanners)) setHeroBanners(data.heroBanners);
    }).catch(console.error);
  }, []);

  // Synchronize when global store products change
  useEffect(() => {
    if (shopProducts && Array.isArray(shopProducts) && shopProducts.length > 0) {
      setProducts(shopProducts);
    }
  }, [shopProducts]);

  useEffect(() => {
    if (shopCategories && Array.isArray(shopCategories) && shopCategories.length > 0) {
      setCategories(shopCategories);
    }
  }, [shopCategories]);

  // Hero banner auto-rotate
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  // Category Manual Slider functions
  const checkCategoryScroll = () => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScrollCategories = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    const scrollAmount = 320;
    categoryScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    checkCategoryScroll();
    const el = categoryScrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkCategoryScroll);
      window.addEventListener('resize', checkCategoryScroll);
      return () => {
        el.removeEventListener('scroll', checkCategoryScroll);
        window.removeEventListener('resize', checkCategoryScroll);
      };
    }
  }, [categories]);

  const safeProducts = Array.isArray(products) ? products : [];
  const flashSaleProducts = safeProducts.filter((p) => p && (p.flash_sale || (p.regular_price && p.regular_price > p.price)));
  const featuredProducts = safeProducts.filter((p) => p && p.featured);
  const laptops = safeProducts.filter((p) => p && Array.isArray(p.categories) && p.categories.some((c) => c?.slug && (c.slug.includes('laptop') || c.slug.includes('computer'))));
  const printers = safeProducts.filter((p) => p && Array.isArray(p.categories) && p.categories.some((c) => c?.slug && c.slug.includes('printer')));
  const networking = safeProducts.filter((p) => p && Array.isArray(p.categories) && p.categories.some((c) => c?.slug && c.slug.includes('networking')));

  const displayedProducts =
    activeTab === 'laptops'
      ? laptops
      : activeTab === 'printers'
      ? printers
      : activeTab === 'networking'
      ? networking
      : safeProducts;

  // Map hero banners to actual products in catalog
  const heroItems = (heroBanners.length > 0 ? heroBanners : INITIAL_HERO_BANNERS).map((banner) => {
    let matchedProduct: Product | undefined;
    if (banner.productId) {
      matchedProduct = safeProducts.find((p) => p.id === banner.productId);
    }
    if (!matchedProduct && banner.title) {
      const lower = banner.title.toLowerCase();
      matchedProduct = safeProducts.find((p) =>
        lower.includes(p.name.toLowerCase().slice(0, 10)) ||
        (banner.brand && p.brand && p.brand.toLowerCase() === banner.brand.toLowerCase())
      );
    }
    return {
      banner,
      product: matchedProduct || safeProducts[0],
    };
  });

  const currentHero = heroItems[currentBannerIndex] || heroItems[0] || {
    banner: INITIAL_HERO_BANNERS[0],
    product: safeProducts[0],
  };

  const currentBanner = currentHero.banner;
  const currentProduct = currentHero.product;

  return (
    <div className="space-y-8 pb-16 bg-[#F1F5F9]">
      {/* 1. HERO SECTION WITH HIGH-DENSITY CATEGORY SIDEBAR + PRODUCT HERO */}
      <section className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
          {/* Left Category Sidebar (High Density) */}
          <div className="hidden lg:flex flex-col bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
            <div className="text-[11px] font-black uppercase text-slate-400 tracking-widest pb-3 mb-1 border-b border-slate-100 flex items-center justify-between">
              <span>Categories</span>
              <span className="text-[10px] text-cyan-600 font-bold">Uganda Hub</span>
            </div>
            <div className="flex-1 py-1 space-y-0.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCurrentView('category', { slug: cat.slug, name: cat.name })}
                  className="w-full text-left px-2 py-1.5 rounded text-[13px] font-medium text-slate-700 hover:text-cyan-600 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span className="line-clamp-1">{cat.name}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-cyan-600">{cat.count}</span>
                </button>
              ))}
            </div>

            {/* Kampala Central Dispatch Hub Highlight */}
            <div className="mt-auto p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>Kampala Dispatch Hub</span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">Kampala Central. Testing & pickup available daily.</p>
            </div>
          </div>

          {/* Center/Right Hero Banner (High Density Product Showcase) */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white min-h-[380px] sm:min-h-[420px] flex items-center shadow-lg group border border-slate-700/80">
              {/* Background Image with Overlay */}
              <img
                src={currentBanner.imageUrl || currentProduct?.images?.[0]?.src}
                alt={currentBanner.title || currentProduct?.name || 'Product Banner'}
                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-1000 ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-slate-900/70" />

              {/* Banner Left/Center Content */}
              <div className="relative z-10 p-5 sm:p-8 max-w-xl flex-1 space-y-3.5">
                {/* Badge & Brand Tag */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{currentBanner.badge || 'VERIFIED HARDWARE'}</span>
                  </span>
                  {currentProduct?.brand && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[10px] tracking-wide uppercase">
                      {currentProduct.brand}
                    </span>
                  )}
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Kampala Dispatch Ready
                  </span>
                </div>

                {/* Product Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                  {currentBanner.title || currentProduct?.name}
                </h1>

                {/* Subtitle / Key Specs */}
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed font-medium">
                  {currentBanner.subtitle || currentProduct?.short_description || currentBanner.tagline}
                </p>

                {/* Spec Highlights */}
                {currentProduct?.attributes && currentProduct.attributes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {currentProduct.attributes.slice(0, 3).map((attr, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-cyan-300 text-[11px] font-semibold"
                      >
                        {attr.options[0] || attr.name}
                      </span>
                    ))}
                    <span className="px-2 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px]">
                      1-Yr Warranty
                    </span>
                  </div>
                )}

                {/* Price Display */}
                {currentProduct && (
                  <div className="flex flex-wrap items-baseline gap-2.5 pt-1">
                    <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {formatPrice(currentProduct.price)}
                    </span>
                    {currentProduct.regular_price && currentProduct.regular_price > currentProduct.price && (
                      <span className="text-xs sm:text-sm text-slate-400 line-through font-medium">
                        {formatPrice(currentProduct.regular_price)}
                      </span>
                    )}
                    {currentProduct.regular_price && currentProduct.regular_price > currentProduct.price && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[10px]">
                        Save {formatPrice(currentProduct.regular_price - currentProduct.price)}
                      </span>
                    )}
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1.5">
                  {currentProduct && (
                    <button
                      onClick={() => setCurrentView('product', currentProduct)}
                      className="py-2.5 px-5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-cyan-500/20 active:scale-95"
                    >
                      <span>View Specifications</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {currentProduct && (
                    <button
                      onClick={() => addToCart(currentProduct, 1)}
                      className="py-2.5 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  )}

                  <button
                    onClick={() => setCurrentView('shop')}
                    className="py-2.5 px-3.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    All Products
                  </button>
                </div>

                {/* Mobile Spotlight Card */}
                {currentProduct && (
                  <div className="sm:hidden pt-2">
                    <div
                      onClick={() => setCurrentView('product', currentProduct)}
                      className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center gap-3 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-lg bg-white p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={currentProduct.images?.[0]?.src}
                          alt={currentProduct.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{currentProduct.name}</p>
                        <p className="text-[11px] font-extrabold text-cyan-400">{formatPrice(currentProduct.price)}</p>
                      </div>
                      <span className="text-[10px] font-bold text-cyan-400 px-2 py-1 bg-cyan-950/60 rounded border border-cyan-800 flex items-center gap-1">
                        View
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Featured Product Spotlight Card (Tablet & Desktop) */}
              {currentProduct && (
                <div className="hidden md:flex flex-col items-center justify-center pr-6 lg:pr-8 py-6 z-10">
                  <div className="relative w-72 lg:w-76 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col p-4 group/card hover:shadow-cyan-500/10 transition-all duration-300">
                    {/* Top Bar inside Card */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {currentProduct.brand || 'Hardware'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        In Stock • Kampala
                      </span>
                    </div>

                    {/* Product Image Stage */}
                    <div
                      onClick={() => setCurrentView('product', currentProduct)}
                      className="w-full h-36 rounded-xl bg-slate-50 flex items-center justify-center p-3 relative overflow-hidden cursor-pointer group-hover/card:bg-slate-100/70 transition-colors"
                    >
                      <img
                        src={currentProduct.images?.[0]?.src}
                        alt={currentProduct.name}
                        className="w-full h-full object-contain transform group-hover/card:scale-108 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {currentProduct.on_sale && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider rounded">
                          SALE
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="pt-3 space-y-1.5">
                      <h3
                        onClick={() => setCurrentView('product', currentProduct)}
                        className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-cyan-600 cursor-pointer transition-colors leading-tight"
                      >
                        {currentProduct.name}
                      </h3>

                      {/* Star Rating */}
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{currentProduct.average_rating || 4.9}</span>
                        <span className="text-slate-400 text-[10px]">({currentProduct.rating_count || 18} reviews)</span>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-2 pt-0.5">
                        <span className="text-sm font-black text-slate-900">
                          {formatPrice(currentProduct.price)}
                        </span>
                        {currentProduct.regular_price && currentProduct.regular_price > currentProduct.price && (
                          <span className="text-[11px] text-slate-400 line-through">
                            {formatPrice(currentProduct.regular_price)}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => addToCart(currentProduct, 1)}
                          className="py-1.5 px-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95 shadow-xs"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          onClick={() => setCurrentView('product', currentProduct)}
                          className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Product Switcher Thumbnails */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Featured Hardware Lineup</span>
                        <span className="text-cyan-600">{currentBannerIndex + 1}/{heroItems.length}</span>
                      </p>
                      <div className="flex items-center gap-1.5">
                        {heroItems.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentBannerIndex(idx)}
                            title={item.product?.name || item.banner.title}
                            className={`relative w-8 h-8 rounded-lg bg-slate-50 border p-0.5 overflow-hidden cursor-pointer transition-all ${
                              currentBannerIndex === idx
                                ? 'border-cyan-500 ring-2 ring-cyan-400/40 scale-105'
                                : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={item.product?.images?.[0]?.src || item.banner.imageUrl}
                              alt={item.banner.title}
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prev / Next Banner Slide Arrows */}
              {heroItems.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length)}
                    aria-label="Previous Product Banner"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % heroItems.length)}
                    aria-label="Next Product Banner"
                    className="absolute right-2 md:right-auto md:left-[calc(100%-320px-1.5rem)] top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Banner Carousel Controls */}
              {heroItems.length > 1 && (
                <div className="absolute bottom-3 left-5 sm:left-8 z-20 flex items-center gap-2">
                  {heroItems.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        currentBannerIndex === idx ? 'w-6 bg-cyan-400' : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Benefits Strip (High Density Clean Badges) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700">
                <Truck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <span className="text-[11px]">Nationwide Delivery</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <span className="text-[11px]">1 Year Tech Warranty</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700">
                <Zap className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-[11px]">MTN / Airtel MoMo</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700">
                <RotateCcw className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <span className="text-[11px]">Kampala Showroom</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLASH DEALS SECTION (HIGH DENSITY DARK SLATE & ORANGE ACCENTS) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-[#0F172A] rounded-xl p-4 sm:p-5 text-white border border-slate-800 shadow-xs">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <span>Top Deals in Uganda</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500 text-white uppercase">
                    Save up to 25%
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Strictly authentic hardware tested & warrantied</p>
              </div>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
                Time Remaining:
              </span>
              <div className="flex items-center gap-1 font-mono text-xs font-bold">
                <div className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-cyan-400">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </div>
                <span>:</span>
                <div className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-cyan-400">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </div>
                <span>:</span>
                <div className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-orange-400">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </div>
              </div>

              <button
                onClick={() => setCurrentView('shop', { flash_sale: true })}
                className="ml-2 py-1 px-3 rounded bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Flash Deal Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
            {flashSaleProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES MANUAL SLIDER */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
              Shop by Tech Category
            </h2>
            <p className="text-xs text-slate-500">Manual slider — slide left or right to explore hardware</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScrollCategories('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll Categories Left"
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleScrollCategories('right')}
              disabled={!canScrollRight}
              aria-label="Scroll Categories Right"
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800 shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('shop')}
              className="text-xs font-bold text-cyan-600 hover:underline ml-2 hidden sm:inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Manual Slider */}
        <div
          ref={categoryScrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth py-2 px-1 no-scrollbar select-none cursor-grab active:cursor-grabbing"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCurrentView('category', { slug: cat.slug, name: cat.name })}
              style={{ scrollSnapAlign: 'start' }}
              className="flex-shrink-0 w-36 sm:w-44 md:w-48 flex flex-col items-center text-center p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-100 flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-cyan-600 transition-colors">
                {cat.name}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{cat.count} items</span>
              <span className="text-[10px] font-bold text-cyan-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Browse &rarr;
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3.5 5-ROW CONTINUOUS PRODUCT CATEGORY SLIDERS (CDT SYSTEMS) */}
      <FiveRowProductSlider />

      {/* 4. MAIN FEATURED PRODUCTS WITH TAB FILTER */}
      <section className="max-w-7xl mx-auto px-4">
        {/* Section Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
              Hardware Catalog in <span className="text-cyan-600">Uganda</span>
            </h2>
            <p className="text-xs text-slate-500">Tested, certified and stocked in Kampala & ready for same-day dispatch</p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto text-xs font-bold shadow-2xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'all' ? 'bg-cyan-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setActiveTab('laptops')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'laptops' ? 'bg-cyan-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Laptops & PCs
            </button>
            <button
              onClick={() => setActiveTab('printers')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'printers' ? 'bg-cyan-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Printers
            </button>
            <button
              onClick={() => setActiveTab('networking')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'networking' ? 'bg-cyan-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4G MiFi & Routers
            </button>
          </div>
        </div>

        {/* Products Grid (High Density 2-col on mobile, 4-col on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => setCurrentView('shop')}
            className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider uppercase transition-colors shadow-xs cursor-pointer"
          >
            Explore Complete Cyber Dynamic Tech Catalog ({products.length}+ Items)
          </button>
        </div>
      </section>

      {/* 5. PHYSICAL SHOWROOM & ENTERPRISE CONTRACTS BANNER */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-xl bg-[#0F172A] text-white p-6 sm:p-8 relative overflow-hidden border border-slate-800 shadow-xs">
          <div className="max-w-2xl relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Kampala Central Head Office</span>
            </span>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Supplying Government, NGOs, Schools & Retailers Across Kampala & Uganda
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Located in Kampala. We provide bulk supplies of laptops, network switches,
              heavy-duty photocopiers, POS thermal printers, and biometric scanners with formal tax invoices and local technical maintenance.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://wa.me/256779743101?text=Hello%20Cyber%20Dynamic%20Tech,%20I%20need%20a%20quotation%20for%20bulk%20equipment"
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
              >
                <span>Request Quotation (WhatsApp)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setCurrentView('contact')}
                className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Store Directions (Kampala)
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
