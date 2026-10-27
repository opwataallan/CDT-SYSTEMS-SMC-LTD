import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Tag,
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
  Settings,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { FiveRowProductSlider } from '../components/FiveRowProductSlider';
import { TopDealsSlider } from '../components/TopDealsSlider';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Product, Category, HeroBanner } from '../types';
import { INITIAL_HERO_BANNERS } from '../data/cyberCatalog';
import { stripHtmlToPlainText } from '../utils/sanitizeWooCommerceHtml';

export const HomePage: React.FC = () => {
  const { setCurrentView, products: shopProducts, categories: shopCategories, addToCart, formatPrice, config, isAdmin } = useShop();

  // Products and categories loaded exclusively from API
  const [products, setProducts] = useState<Product[]>(() => (shopProducts && shopProducts.length > 0 ? shopProducts : []));
  const [categories, setCategories] = useState<Category[]>(() => (shopCategories && shopCategories.length > 0 ? shopCategories : []));
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(() => INITIAL_HERO_BANNERS);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'laptops' | 'printers' | 'networking'>('all');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Category Manual Slider ref & scroll tracking
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDraggingCategories, setIsDraggingCategories] = useState(false);
  const catStartXRef = useRef(0);
  const catScrollLeftRef = useRef(0);
  const catHasMovedRef = useRef(false);

  // Fetch initial catalog data from live API (up to 5,000 products)
  useEffect(() => {
    setIsLoadingCatalog(true);
    api.getProducts({ limit: 5000 }).then((res) => {
      if (res && Array.isArray(res.products) && res.products.length > 0) {
        setProducts(res.products);
      }
    }).catch(console.error).finally(() => {
      setIsLoadingCatalog(false);
    });
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

  // Category mouse drag handlers (allow users to scroll without arrows)
  const handleCatMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return;
    setIsDraggingCategories(true);
    catHasMovedRef.current = false;
    catStartXRef.current = e.pageX - categoryScrollRef.current.offsetLeft;
    catScrollLeftRef.current = categoryScrollRef.current.scrollLeft;
  };

  const handleCatMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCategories || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - catStartXRef.current) * 1.4;
    if (Math.abs(walk) > 4) {
      catHasMovedRef.current = true;
    }
    categoryScrollRef.current.scrollLeft = catScrollLeftRef.current - walk;
  };

  const handleCatMouseUp = () => {
    if (isDraggingCategories) {
      setIsDraggingCategories(false);
      setTimeout(() => {
        catHasMovedRef.current = false;
      }, 100);
    }
  };

  // Category touch swipe handlers (support horizontal mobile swipe)
  const catTouchStartXRef = useRef<number>(0);
  const catTouchScrollLeftRef = useRef<number>(0);

  const handleCatTouchStart = (e: React.TouchEvent) => {
    if (!categoryScrollRef.current) return;
    catHasMovedRef.current = false;
    catTouchStartXRef.current = e.touches[0].pageX - categoryScrollRef.current.offsetLeft;
    catTouchScrollLeftRef.current = categoryScrollRef.current.scrollLeft;
  };

  const handleCatTouchMove = (e: React.TouchEvent) => {
    if (!categoryScrollRef.current) return;
    const x = e.touches[0].pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - catTouchStartXRef.current);
    if (Math.abs(walk) > 4) {
      catHasMovedRef.current = true;
    }
  };

  const handleCatTouchEnd = () => {
    setTimeout(() => {
      catHasMovedRef.current = false;
    }, 100);
    checkCategoryScroll();
  };

  useEffect(() => {
    checkCategoryScroll();
    const el = categoryScrollRef.current;
    if (el) {
      const handleWheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey && !e.ctrlKey) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 0.9;
          checkCategoryScroll();
        }
      };

      el.addEventListener('scroll', checkCategoryScroll);
      el.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('resize', checkCategoryScroll);
      return () => {
        el.removeEventListener('scroll', checkCategoryScroll);
        el.removeEventListener('wheel', handleWheel);
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

  // Curated catalog limit: 12 products (2 rows of 6 on desktop, 4 rows of 3 on mobile)
  const [catalogLimit, setCatalogLimit] = useState(12);

  useEffect(() => {
    setCatalogLimit(12);
  }, [activeTab]);

  const visibleCatalogProducts = useMemo(() => {
    return displayedProducts.slice(0, catalogLimit);
  }, [displayedProducts, catalogLimit]);

  // Build hero product lineup directly from catalog products from API
  const heroProducts = useMemo(() => {
    if (safeProducts.length === 0) return [];
    const withImages = safeProducts.filter((p) => p && p.images && p.images.length > 0);
    const pool = withImages.length > 0 ? withImages : safeProducts;
    const featured = pool.filter((p) => p.featured || p.flash_sale);
    if (featured.length >= 6) return featured.slice(0, 6);
    const remainder = pool.filter((p) => !featured.some((f) => f.id === p.id));
    return [...featured, ...remainder].slice(0, 6);
  }, [safeProducts]);

  const activeHeroProducts = heroProducts.length > 0 ? heroProducts : safeProducts.slice(0, 6);

  // Auto-rotate hero products
  useEffect(() => {
    if (activeHeroProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeHeroProducts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeHeroProducts.length]);

  const currentProduct = activeHeroProducts[currentBannerIndex % Math.max(1, activeHeroProducts.length)] || safeProducts[0];
  const currentBanner = heroBanners[currentBannerIndex] || INITIAL_HERO_BANNERS[0];

  // Mobile touch swipe handling for hero banner
  const heroTouchStartX = useRef<number>(0);
  const handleHeroTouchStart = (e: React.TouchEvent) => {
    heroTouchStartX.current = e.touches[0].clientX;
  };
  const handleHeroTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = heroTouchStartX.current - touchEndX;
    if (diff > 45) {
      setCurrentBannerIndex((prev) => (prev + 1) % Math.max(1, activeHeroProducts.length));
    } else if (diff < -45) {
      setCurrentBannerIndex((prev) => (prev - 1 + activeHeroProducts.length) % Math.max(1, activeHeroProducts.length));
    }
  };

  const handlePrevHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentBannerIndex((prev) => (prev - 1 + activeHeroProducts.length) % Math.max(1, activeHeroProducts.length));
  };

  const handleNextHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentBannerIndex((prev) => (prev + 1) % Math.max(1, activeHeroProducts.length));
  };

  const heroBannerImageSrc =
    config?.homepage?.hero_banner_image ||
    config?.homepage?.hero_image ||
    '/assets/cdt-hero-banner.svg';

  const handleHeroBannerClick = () => {
    const link = config?.homepage?.hero_banner_link || 'shop';
    if (link.startsWith('category:')) {
      const catSlug = link.replace('category:', '');
      setCurrentView('shop', { category: catSlug });
    } else if (link.startsWith('product:')) {
      const prodId = parseInt(link.replace('product:', ''), 10);
      const prod = products.find((p) => p.id === prodId);
      if (prod) {
        setCurrentView('product', prod);
      } else {
        setCurrentView('shop');
      }
    } else if (link === 'pos') {
      setCurrentView('pos');
    } else {
      setCurrentView(link || 'shop');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-10">
      {/* 1. STOREFRONT HERO IMAGE BANNER (CONFIGURABLE VIA ADMIN SETTINGS) */}
      <section className="max-w-7xl mx-auto px-4 pt-2 sm:pt-3">
        <div
          onClick={handleHeroBannerClick}
          className="relative w-full rounded-2xl overflow-hidden shadow-lg border-2 border-[#920d35]/60 hover:border-[#f59e0b] bg-slate-950 transition-all duration-300 cursor-pointer group"
        >
          {/* Hero Banner Image */}
          <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[28/9] min-h-[160px] sm:min-h-[200px] md:min-h-[240px] max-h-[360px] overflow-hidden flex items-center justify-center bg-gradient-to-r from-[#0f172a] via-[#580c1f] to-[#0f172a]">
            <img
              src={heroBannerImageSrc}
              alt={config?.homepage?.hero_banner_alt || 'Cyber Dynamic Technologies Official Banner'}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.015]"
              loading="eager"
            />

            {/* Subtle Gradient Overlays for Brand Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />

            {/* Gold Brand Accent Badge */}
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[#0f172a]/90 backdrop-blur-md text-amber-300 border border-amber-400/40 rounded-lg text-[10px] sm:text-xs font-bold shadow-md flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>CYBER DYNAMIC TECHNOLOGIES</span>
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 bg-[#920d35]/90 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-md border border-white/20">
                Official Hardware Hub
              </span>
            </div>

            {/* Click to Explore Action Pill */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
              <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-[#920d35] group-hover:bg-[#770929] text-white text-[11px] sm:text-xs font-bold rounded-lg shadow-md border border-amber-400/40 flex items-center gap-1.5 transition-all">
                <span>Explore Catalog</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </span>
            </div>

            {/* Admin Quick Settings Shortcut */}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentView('admin');
                }}
                className="absolute top-3 right-3 z-20 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#0f172a]/90 hover:bg-[#920d35] text-amber-300 hover:text-white rounded-lg text-[10px] sm:text-xs font-bold border border-amber-400/40 backdrop-blur-md shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                title="Update Hero Banner image in Admin Settings"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Update Banner (Settings)</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. FLASH DEALS SLIDER (RESPONSIVE 3 ON MOBILE, 6 ON PC WITH BRIGHT TIMER & DRAG SCROLL) */}
      <TopDealsSlider products={products} />

      {/* 3. CATEGORIES MANUAL SLIDER */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Categories
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleScrollCategories('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll Categories Left"
              className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
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
              className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
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
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Manual Slider (Supports Touch Swipe & Mouse Drag) */}
        <div
          ref={categoryScrollRef}
          onMouseDown={handleCatMouseDown}
          onMouseMove={handleCatMouseMove}
          onMouseUp={handleCatMouseUp}
          onMouseLeave={handleCatMouseUp}
          onTouchStart={handleCatTouchStart}
          onTouchMove={handleCatTouchMove}
          onTouchEnd={handleCatTouchEnd}
          className="flex gap-2 sm:gap-2.5 overflow-x-auto scroll-smooth py-1.5 px-0.5 no-scrollbar select-none cursor-grab active:cursor-grabbing snap-x touch-pan-x"
          style={{
            touchAction: 'pan-x pan-y',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {categories.slice(0, 12).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                if (catHasMovedRef.current) return;
                setCurrentView('category', { slug: cat.slug, name: cat.name });
              }}
              style={{ scrollSnapAlign: 'start' }}
              className="flex-shrink-0 w-28 sm:w-36 md:w-40 flex flex-col items-center text-center p-2 rounded-xl bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-slate-100 mb-1.5 border border-slate-100 flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 line-clamp-1 group-hover:text-cyan-600 transition-colors">
                {cat.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">{cat.count} items</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3.5 5-ROW CONTINUOUS PRODUCT CATEGORY SLIDERS (CDT SYSTEMS) */}
      <FiveRowProductSlider />

      {/* 4. MAIN FEATURED PRODUCTS WITH TAB FILTER */}
      <section className="max-w-7xl mx-auto px-4">
        {/* Section Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5 sm:mb-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            All Hardware
          </h2>

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

        {/* Hardware Products Display: 2 Columns for Mobile Display */}
        {isLoadingCatalog && visibleCatalogProducts.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3">
            <ProductCardSkeleton count={12} />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3">
            {visibleCatalogProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* View Controls: Show More / Explore Full Catalog */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mt-4">
          {displayedProducts.length > visibleCatalogProducts.length && (
            <button
              onClick={() => setCatalogLimit((prev) => prev + 12)}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-cyan-500 hover:text-cyan-600 text-slate-800 font-bold text-xs tracking-wide uppercase transition-all shadow-2xs cursor-pointer"
            >
              Load More Hardware ({visibleCatalogProducts.length} of {displayedProducts.length})
            </button>
          )}
          <button
            onClick={() => setCurrentView('shop')}
            className="w-full sm:w-auto px-5 py-2 sm:px-6 sm:py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider uppercase transition-colors shadow-xs cursor-pointer"
          >
            Explore Complete Catalog ({products.length}+ Items)
          </button>
        </div>
      </section>

      {/* 5. ENTERPRISE & BULK ORDERS */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-xl bg-[#0F172A] text-white p-5 sm:p-6 border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-base sm:text-lg font-bold tracking-tight">
              Enterprise & Bulk Hardware Procurement
            </h3>
            <p className="text-xs text-slate-400">
              Bulk supplies of laptops, networking switches, copiers, and POS hardware with official tax invoices and CDT warranty.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="https://wa.me/256779743101?text=Hello%20Cyber%20Dynamic%20Tech,%20I%20need%20a%20quotation%20for%20bulk%20equipment"
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <span>Request Quote</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setCurrentView('contact')}
              className="py-2 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Kampala Store
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
