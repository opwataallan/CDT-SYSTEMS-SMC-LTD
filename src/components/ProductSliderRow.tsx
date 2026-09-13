import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, ArrowRight, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { SliderProductCard } from './SliderProductCard';
import { useShop } from '../context/ShopContext';
import { INITIAL_PRODUCTS } from '../data/cyberCatalog';

export interface ProductSliderRowProps {
  rowNumber: number;
  title: string;
  categorySlug: string;
  subCategoriesText?: string;
  badgeText?: string;
  speed?: number; // pixels per frame (e.g., 0.5)
  direction?: 'left-to-right' | 'right-to-left';
  products?: Product[];
  filterCategorySlugs?: string[]; // for matching multiple category aliases
}

export const ProductSliderRow: React.FC<ProductSliderRowProps> = ({
  rowNumber,
  title,
  categorySlug,
  subCategoriesText,
  badgeText,
  speed = 0.5,
  direction = 'left-to-right',
  products: propProducts,
  filterCategorySlugs,
}) => {
  const { products: storeProducts, setCurrentView } = useShop();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [singleSetWidth, setSingleSetWidth] = useState(0);

  // Refs for smooth drag handling without re-renders
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasMovedRef = useRef(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Filter products for this row
  const rowProducts = useMemo(() => {
    const rawList = propProducts && propProducts.length > 0 ? propProducts : storeProducts;
    const list = Array.isArray(rawList) && rawList.length > 0 ? rawList : INITIAL_PRODUCTS;
    const targetSlugs = filterCategorySlugs || [categorySlug];
    const safeList = Array.isArray(list) ? list : [];

    const filtered = safeList.filter((p) => {
      if (!p) return false;
      // Check categories
      if (p.categories && Array.isArray(p.categories) && p.categories.length > 0) {
        const matchesCategory = p.categories.some((c) =>
          Boolean(
            c?.slug &&
            targetSlugs.some(
              (slug) =>
                c.slug.toLowerCase().includes(slug.toLowerCase()) ||
                (c.name && c.name.toLowerCase().includes(slug.toLowerCase().replace(/-/g, ' ')))
            )
          )
        );
        if (matchesCategory) return true;
      }
      // Also check product name or description
      const searchTarget = `${p.name || ''} ${p.short_description || ''} ${p.brand || ''}`.toLowerCase();
      return targetSlugs.some((slug) =>
        searchTarget.includes(slug.toLowerCase().replace(/-/g, ' '))
      );
    });

    // If filter returns few products, fallback to top products to ensure a full slider
    if (filtered.length < 3) {
      return safeList.slice(0, 8);
    }
    return filtered;
  }, [propProducts, storeProducts, categorySlug, filterCategorySlugs]);

  // Triple the list to enable seamless infinite wrapping
  const repeatedProducts = useMemo(() => {
    if (rowProducts.length === 0) return [];
    return [...rowProducts, ...rowProducts, ...rowProducts];
  }, [rowProducts]);

  // Calculate width of one single set of items
  const updateSingleSetWidth = useCallback(() => {
    if (!trackRef.current) return;
    const totalWidth = trackRef.current.scrollWidth;
    const singleWidth = totalWidth / 3;
    setSingleSetWidth(singleWidth);

    // Position in the middle set initially so wrapping works in both directions
    if (containerRef.current && singleWidth > 0 && containerRef.current.scrollLeft === 0) {
      containerRef.current.scrollLeft = singleWidth;
    }
  }, []);

  useEffect(() => {
    updateSingleSetWidth();
    const handleResize = () => updateSingleSetWidth();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [repeatedProducts, updateSingleSetWidth]);

  // IntersectionObserver to pause when offscreen (saves CPU & battery)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Main animation frame loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container || singleSetWidth <= 0) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = (time - lastTime) / 16.666; // Normalize to 60fps
      lastTime = time;

      // Only move if playing, not hovered, not dragged, not touched, and visible on screen
      if (
        isPlaying &&
        !isHovered &&
        !isInteracting &&
        !isDraggingRef.current &&
        isVisibleRef.current
      ) {
        const step = speed * (direction === 'left-to-right' ? -1 : 1) * Math.min(delta, 2);
        container.scrollLeft += step;

        // Seamless wrap around
        if (container.scrollLeft <= 10) {
          // If moving leftwards and reaching the start of Set 1, loop to Set 2
          container.scrollLeft += singleSetWidth;
        } else if (container.scrollLeft >= singleSetWidth * 2) {
          // If moving rightwards and reaching Set 3, loop back to Set 2
          container.scrollLeft -= singleSetWidth;
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, isHovered, isInteracting, singleSetWidth, speed, direction]);

  // Temporary interaction pause helper
  const pauseTemporarily = useCallback((durationMs = 2000) => {
    setIsInteracting(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, durationMs);
  }, []);

  // Manual Arrow Navigation
  const handleScrollLeft = () => {
    pauseTemporarily(3000);
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    pauseTemporarily(3000);
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftStartRef.current = containerRef.current.scrollLeft;
    setIsInteracting(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // Drag speed multiplier
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    containerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      pauseTemporarily(1500);
      // Clean up drag flag after slight delay so card clicks can detect if it was a drag
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 100);
    }
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = () => {
    setIsInteracting(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
  };

  const handleTouchEnd = () => {
    pauseTemporarily(2000);
  };

  const handleViewAll = () => {
    setCurrentView('shop', { category: categorySlug });
  };

  if (rowProducts.length === 0) {
    return null;
  }

  return (
    <section
      id={`product-slider-row-${rowNumber}`}
      className="py-4 border-b border-slate-100 last:border-b-0 overflow-hidden"
    >
      {/* Category Header with Row Number, Title, Controls, and View All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-cyan-400 font-mono text-xs font-bold shrink-0">
            {rowNumber}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                {title}
              </h2>
              {badgeText && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-bold">
                  <Sparkles className="w-2.5 h-2.5" />
                  {badgeText}
                </span>
              )}
            </div>
            {subCategoriesText && (
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-1">
                {subCategoriesText}
              </p>
            )}
          </div>
        </div>

        {/* Controls: Play/Pause, Left/Right Arrows, and View All */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                isPlaying
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  : 'bg-cyan-600 text-white shadow-2xs'
              }`}
              title={isPlaying ? 'Pause auto-scroll' : 'Resume auto-scroll'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>

            {/* Left Nav Arrow */}
            <button
              type="button"
              onClick={handleScrollLeft}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Previous products"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Right Nav Arrow */}
            <button
              type="button"
              onClick={handleScrollRight}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="Next products"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View All Button */}
          <button
            type="button"
            onClick={handleViewAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 border border-cyan-200 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Continuous Auto-Scrolling Track Container */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handleMouseUpOrLeave();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none"
        style={{
          touchAction: 'pan-y', // allows smooth vertical page scrolling on mobile!
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          ref={trackRef}
          className="flex items-stretch gap-3 sm:gap-4 py-2 w-max"
        >
          {repeatedProducts.map((product, index) => (
            <SliderProductCard
              key={`${product.id}-row${rowNumber}-${index}`}
              product={product}
              isDraggingRef={hasMovedRef}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
