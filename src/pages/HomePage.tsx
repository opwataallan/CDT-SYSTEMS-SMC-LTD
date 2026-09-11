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
  Play,
  Pause,
  SlidersHorizontal,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Product, Category, HeroBanner } from '../types';

export const HomePage: React.FC = () => {
  const { setCurrentView } = useShop();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'laptops' | 'printers' | 'networking'>('all');

  // Product Auto Slider (Displays 3 products at a time)
  const [productSlideIndex, setProductSlideIndex] = useState(0);
  const [isProductAutoPlaying, setIsProductAutoPlaying] = useState(true);
  const [isProductSliderHovered, setIsProductSliderHovered] = useState(false);

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

  // Fetch initial catalog data
  useEffect(() => {
    api.getProducts({ limit: 24 }).then((res) => setProducts(res.products)).catch(console.error);
    api.getCategories().then(setCategories).catch(console.error);
    api.getAdminSettings().then((data) => {
      if (data.heroBanners) setHeroBanners(data.heroBanners);
    }).catch(console.error);
  }, []);

  // Hero banner auto-rotate
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  // Product Auto-Slider: Displays 3 products and rotates automatically
  const autoSliderPool = products.length > 0 ? products : [];
  const totalProductPages = Math.max(1, Math.ceil(autoSliderPool.length / 3));

  useEffect(() => {
    if (!isProductAutoPlaying || isProductSliderHovered || autoSliderPool.length <= 3) return;
    const interval = setInterval(() => {
      setProductSlideIndex((prev) => (prev + 1) % totalProductPages);
    }, 4000);
    return () => clearInterval(interval);
  }, [isProductAutoPlaying, isProductSliderHovered, autoSliderPool.length, totalProductPages]);

  const handlePrevProductSlide = () => {
    setProductSlideIndex((prev) => (prev - 1 + totalProductPages) % totalProductPages);
  };

  const handleNextProductSlide = () => {
    setProductSlideIndex((prev) => (prev + 1) % totalProductPages);
  };

  // Extract exactly 3 products for the current slide page
  const currentThreeProducts = autoSliderPool.slice(productSlideIndex * 3, productSlideIndex * 3 + 3);
  const threeProductsToDisplay =
    currentThreeProducts.length === 3
      ? currentThreeProducts
      : [
          ...currentThreeProducts,
          ...autoSliderPool.slice(0, Math.max(0, 3 - currentThreeProducts.length)),
        ];

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

  const flashSaleProducts = products.filter((p) => p.flash_sale || p.regular_price > p.price);
  const featuredProducts = products.filter((p) => p.featured);
  const laptops = products.filter((p) => p.categories.some((c) => c.slug.includes('laptop') || c.slug.includes('computer')));
  const printers = products.filter((p) => p.categories.some((c) => c.slug.includes('printer')));
  const networking = products.filter((p) => p.categories.some((c) => c.slug.includes('networking')));

  const displayedProducts =
    activeTab === 'laptops'
      ? laptops
      : activeTab === 'printers'
      ? printers
      : activeTab === 'networking'
      ? networking
      : products;

  const currentBanner = heroBanners[currentBannerIndex] || {
    id: 1,
    title: 'High-Performance Business Laptops & Workstations',
    subtitle: 'Official warranty, configured for Ugandan enterprises, institutions & students.',
    cta_text: 'Explore Laptops',
    cta_link: 'shop',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1400&auto=format&fit=crop&q=80',
    badge: '12-Month Warranty',
  };

  return (
    <div className="space-y-8 pb-16 bg-[#F1F5F9]">
      {/* 1. HERO SECTION WITH HIGH-DENSITY CATEGORY SIDEBAR + SLIDER */}
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

          {/* Center/Right Hero Banner (High Density Dark Slate + Cyan Accents) */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="relative rounded-xl overflow-hidden bg-slate-800 text-white min-h-[340px] sm:min-h-[380px] flex items-center shadow-xs group border border-slate-700">
              {/* Background Image with Overlay */}
              <img
                src={currentBanner.image}
                alt={currentBanner.title}
                className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />

              {/* Banner Content */}
              <div className="relative z-10 p-6 sm:p-8 max-w-lg space-y-3">
                {currentBanner.badge && (
                  <span className="inline-flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-widest text-[11px]">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{currentBanner.badge}</span>
                  </span>
                )}

                <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                  {currentBanner.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                  {currentBanner.subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentView('shop')}
                    className="py-2.5 px-6 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <span>{currentBanner.cta_text || 'Shop Deals'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setCurrentView('track-order')}
                    className="py-2.5 px-4 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Track Order
                  </button>
                </div>
              </div>

              {/* High Density Flash Circular Badge (From design snippet) */}
              <div className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 z-10">
                <div className="w-40 h-40 bg-slate-700/60 rounded-full border border-slate-600 flex flex-col items-center justify-center backdrop-blur-xs text-center shadow-lg p-2">
                  <span className="text-2xl font-black text-white tracking-tight">FLASH</span>
                  <span className="text-orange-400 font-black text-[10px] uppercase tracking-wider">SPECIAL DEALS</span>
                  <span className="text-cyan-400 text-[10px] font-mono font-bold mt-1">
                    {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Banner Carousel Controls */}
              {heroBanners.length > 1 && (
                <div className="absolute bottom-4 left-6 sm:left-8 z-20 flex items-center gap-2">
                  {heroBanners.map((_, idx) => (
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

      {/* 2.5 PRODUCT AUTO SLIDER (DISPLAYS THREE PRODUCTS) */}
      <section className="max-w-7xl mx-auto px-4">
        <div
          id="front-page-product-auto-slider"
          className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs transition-all duration-300"
          onMouseEnter={() => setIsProductSliderHovered(true)}
          onMouseLeave={() => setIsProductSliderHovered(false)}
        >
          {/* Header row with controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 tracking-wider">
                  Auto-Slider Spotlight
                </span>
                <span className="text-[11px] font-semibold flex items-center gap-1.5">
                  {isProductSliderHovered ? (
                    <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                      Paused on Hover
                    </span>
                  ) : isProductAutoPlaying ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Auto-Rotating (3 Products)
                    </span>
                  ) : (
                    <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded text-[10px]">
                      Paused
                    </span>
                  )}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 mt-1">
                Featured Tech Auto-Showcase
              </h2>
              <p className="text-[11px] text-slate-500">
                Live rotating showcase displaying 3 high-demand workstations, enterprise gear & accessories
              </p>
            </div>

            {/* Slider Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProductAutoPlaying(!isProductAutoPlaying)}
                title={isProductAutoPlaying ? 'Pause Auto-Slider' : 'Resume Auto-Slider'}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                aria-label={isProductAutoPlaying ? 'Pause' : 'Play'}
              >
                {isProductAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-slate-600" />}
              </button>

              <button
                type="button"
                onClick={handlePrevProductSlide}
                title="Previous 3 Products"
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                aria-label="Previous Products"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Slide indicators */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalProductPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setProductSlideIndex(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      productSlideIndex === i ? 'w-6 bg-cyan-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextProductSlide}
                title="Next 3 Products"
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                aria-label="Next Products"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Three Products Display Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4">
            {threeProductsToDisplay.map((product) => (
              <ProductCard key={`auto-slider-prod-${product.id}`} product={product} />
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
