import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Pause, Play, Hand, Smartphone } from 'lucide-react';
import { Product, AdvertFlyer } from '../types';
import { SliderProductCard } from './SliderProductCard';
import { AdvertFlyerCard } from './AdvertFlyerCard';
import { useShop } from '../context/ShopContext';

export interface ProductSliderRowProps {
  rowNumber: number;
  title: string;
  categorySlug: string;
  subCategoriesText?: string;
  badgeText?: string;
  speed?: number; // pixels per frame (e.g. 0.5)
  direction?: 'left-to-right' | 'right-to-left';
  autoScroll?: boolean; // when true, auto scrolls; when false, responds strictly to manual swipe
  maxProducts?: number; // limits products (e.g., 3 products for slider 2 and 4)
  products?: Product[];
  filterCategorySlugs?: string[]; // for matching multiple category aliases
  fliers?: AdvertFlyer[]; // optional promotional advert fliers (for rows 2 & 4)
}

export const ProductSliderRow: React.FC<ProductSliderRowProps> = ({
  rowNumber,
  title,
  categorySlug,
  subCategoriesText,
  badgeText,
  speed = 0.5,
  direction = 'left-to-right',
  autoScroll = false,
  maxProducts,
  products: propProducts,
  filterCategorySlugs,
  fliers,
}) => {
  const { products: storeProducts, setCurrentView } = useShop();

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // States for manual control & auto-scroll
  const [isPlaying, setIsPlaying] = useState(true);
  const [isManualSwipeOnly, setIsManualSwipeOnly] = useState(!autoScroll);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [singleSetWidth, setSingleSetWidth] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Synchronize when autoScroll prop changes
  useEffect(() => {
    setIsManualSwipeOnly(!autoScroll);
  }, [autoScroll]);

  // Refs for drag without re-renders
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasMovedRef = useRef(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Check if this row is rendering advert fliers
  const hasFliers = Boolean(fliers && fliers.length > 0);
  const activeAutoScroll = !isManualSwipeOnly && !hasFliers;

  // Filter products for this row
  const rowProducts = useMemo(() => {
    if (hasFliers) return [];
    const rawList = propProducts && propProducts.length > 0 ? propProducts : storeProducts;
    const safeList = Array.isArray(rawList) ? rawList : [];
    const targetSlugs = filterCategorySlugs || [categorySlug];

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

    const list = filtered.length > 0 ? filtered : safeList;
    const limit = maxProducts && maxProducts > 0 ? maxProducts : 10;
    return list.slice(0, limit);
  }, [propProducts, storeProducts, categorySlug, filterCategorySlugs, maxProducts, hasFliers]);

  // For auto-scroll rows, repeat 3x to ensure smooth infinite wrap-around
  // For manual rows (sliders 2 and 4), do NOT repeat - strictly show the 3 products or fliers
  const displayedProducts = useMemo(() => {
    if (!activeAutoScroll || rowProducts.length === 0) {
      return rowProducts.map((p, idx) => ({ product: p, uniqueKey: `${p.id}-row${rowNumber}-${idx}` }));
    }
    // Repeat 3 times for seamless wrapping
    return [
      ...rowProducts.map((p, idx) => ({ product: p, uniqueKey: `${p.id}-row${rowNumber}-set0-${idx}` })),
      ...rowProducts.map((p, idx) => ({ product: p, uniqueKey: `${p.id}-row${rowNumber}-set1-${idx}` })),
      ...rowProducts.map((p, idx) => ({ product: p, uniqueKey: `${p.id}-row${rowNumber}-set2-${idx}` })),
    ];
  }, [activeAutoScroll, rowProducts, rowNumber]);

  // Update bounds for manual rows
  const updateScrollBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  // Calculate width of one single set of items for auto-scrolling
  const updateSingleSetWidth = useCallback(() => {
    if (!activeAutoScroll || !trackRef.current) return;
    const totalWidth = trackRef.current.scrollWidth;
    const singleWidth = totalWidth / 3;
    setSingleSetWidth(singleWidth);

    // Position in the middle set initially so wrapping works seamlessly in both directions
    if (containerRef.current && singleWidth > 0 && containerRef.current.scrollLeft === 0) {
      containerRef.current.scrollLeft = singleWidth;
    }
  }, [activeAutoScroll]);

  useEffect(() => {
    if (activeAutoScroll) {
      updateSingleSetWidth();
      const handleResize = () => updateSingleSetWidth();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      updateScrollBounds();
      const handleResize = () => updateScrollBounds();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [activeAutoScroll, updateSingleSetWidth, updateScrollBounds, displayedProducts]);

  // IntersectionObserver to pause auto-scroll when offscreen (saves CPU & battery)
  useEffect(() => {
    if (!activeAutoScroll) return;
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
  }, [activeAutoScroll]);

  // Temporary interaction pause helper for auto-scroll
  const pauseTemporarily = useCallback((durationMs = 2500) => {
    if (!activeAutoScroll) return;
    setIsInteracting(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, durationMs);
  }, [activeAutoScroll]);

  // Mouse wheel horizontal scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        pauseTemporarily(2500);
        container.scrollLeft += e.deltaY * 0.9;
        if (!activeAutoScroll) {
          updateScrollBounds();
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [activeAutoScroll, pauseTemporarily, updateScrollBounds]);

  // Main animation frame loop - ONLY runs when activeAutoScroll is true
  useEffect(() => {
    if (!activeAutoScroll) return;
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
        const step = speed * (direction === 'left-to-right' ? 1 : -1) * Math.min(delta, 2);
        container.scrollLeft += step;

        // Seamless wrap around
        if (container.scrollLeft <= 10) {
          container.scrollLeft += singleSetWidth;
        } else if (container.scrollLeft >= singleSetWidth * 2) {
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
  }, [activeAutoScroll, isPlaying, isHovered, isInteracting, singleSetWidth, speed, direction]);

  // Global mousemove and mouseup listeners when dragging
  useEffect(() => {
    const onGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const x = e.pageX - containerRef.current.offsetLeft;
      const walk = (x - startXRef.current) * 1.5;
      if (Math.abs(walk) > 4) {
        hasMovedRef.current = true;
      }
      containerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
      if (!activeAutoScroll) {
        updateScrollBounds();
      }
    };

    const onGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        pauseTemporarily(2000);
        setTimeout(() => {
          hasMovedRef.current = false;
        }, 100);
        if (!activeAutoScroll) {
          updateScrollBounds();
        }
      }
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, [activeAutoScroll, pauseTemporarily, updateScrollBounds]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftStartRef.current = containerRef.current.scrollLeft;
    pauseTemporarily(2500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    containerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    if (!activeAutoScroll) {
      updateScrollBounds();
    }
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      pauseTemporarily(2000);
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 100);
      if (!activeAutoScroll) {
        updateScrollBounds();
      }
    }
  };

  // Touch gesture handlers for mobile screen touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.touches[0].pageX - containerRef.current.offsetLeft;
    scrollLeftStartRef.current = containerRef.current.scrollLeft;
    pauseTemporarily(3000);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const x = e.touches[0].pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.25;
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    containerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
    pauseTemporarily(2000);
    if (!activeAutoScroll) {
      updateScrollBounds();
    }
  };

  const handleTouchEnd = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      pauseTemporarily(2000);
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 120);
      if (!activeAutoScroll) {
        setTimeout(updateScrollBounds, 150);
      }
    }
  };

  // Arrow step buttons
  const handleScrollLeft = () => {
    pauseTemporarily(3000);
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
      if (!activeAutoScroll) {
        setTimeout(updateScrollBounds, 350);
      }
    }
  };

  const handleScrollRight = () => {
    pauseTemporarily(3000);
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
      if (!activeAutoScroll) {
        setTimeout(updateScrollBounds, 350);
      }
    }
  };

  const handleViewAll = () => {
    setCurrentView('shop', { category: categorySlug });
  };

  // If no fliers and no products, skip rendering
  if (!hasFliers && rowProducts.length === 0) {
    return null;
  }

  return (
    <section
      id={`product-slider-row-${rowNumber}`}
      className="py-2.5 sm:py-3.5 border-b border-slate-100 last:border-b-0 overflow-hidden"
    >
      {/* Category Header with Row Number, Title, Scroll Mode Tag, and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-cyan-400 font-mono text-xs font-bold shrink-0">
            {rowNumber}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                {title}
              </h2>
              {badgeText && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-bold">
                  <Sparkles className="w-2.5 h-2.5" />
                  {badgeText}
                </span>
              )}
              {hasFliers && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                  Advert Flyers • 3 Promotions
                </span>
              )}
              {/* Distinct Mode Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isManualSwipeOnly
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {isManualSwipeOnly ? (
                  <>
                    <Hand className="w-2.5 h-2.5 text-amber-600" />
                    Manual Touch Swipe
                  </>
                ) : (
                  <>
                    <Play className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600" />
                    Auto Scrolling
                  </>
                )}
              </span>
            </div>
            {subCategoriesText && (
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                {subCategoriesText}
              </p>
            )}
          </div>
        </div>

        {/* Controls: User Mode Toggle (Manual Swipe / Auto Scroll), Left/Right Arrows, and View All */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {/* Screen Touch / User Manual Swipe Toggle button: Allows user to enable or remove manual swipe */}
            <button
              type="button"
              onClick={() => setIsManualSwipeOnly(!isManualSwipeOnly)}
              className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isManualSwipeOnly
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 shadow-2xs'
              }`}
              title={isManualSwipeOnly ? 'Remove manual swipe (Switch to Auto Scroll)' : 'Enable manual swipe mode'}
            >
              {isManualSwipeOnly ? (
                <>
                  <Hand className="w-3 h-3 text-white" />
                  <span className="text-[10px] hidden xs:inline">Manual Swipe</span>
                  <span className="text-[9px] text-amber-200 underline xs:hidden">Manual</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-cyan-600 fill-cyan-600" />
                  <span className="text-[10px] hidden xs:inline">Auto Scroll</span>
                  <span className="text-[9px] text-cyan-700 xs:hidden">Auto</span>
                </>
              )}
            </button>

            {/* Play/Pause Button - ONLY active when auto-scrolling */}
            {activeAutoScroll && (
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isPlaying
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    : 'bg-cyan-600 text-white shadow-2xs'
                }`}
                title={isPlaying ? 'Pause auto-scroll' : 'Resume auto-scroll'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
            )}

            {/* Left Nav Arrow */}
            <button
              type="button"
              onClick={handleScrollLeft}
              disabled={activeAutoScroll ? false : !canScrollLeft}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                activeAutoScroll || canScrollLeft
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-white shadow-2xs'
                  : 'text-slate-300 cursor-not-allowed opacity-40'
              }`}
              title="Scroll left"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Right Nav Arrow */}
            <button
              type="button"
              onClick={handleScrollRight}
              disabled={activeAutoScroll ? false : !canScrollRight}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                activeAutoScroll || canScrollRight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-white shadow-2xs'
                  : 'text-slate-300 cursor-not-allowed opacity-40'
              }`}
              title="Scroll right"
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

      {/* Horizontal Track Container:
          - Screen touch devices and mouse users can smoothly swipe or drag
          - In Auto-Scroll mode: continuous smooth movement
          - In Manual Swipe mode: clean touch swipe, no automatic interval
      */}
      <div
        ref={containerRef}
        onMouseEnter={() => {
          if (activeAutoScroll) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (activeAutoScroll) setIsHovered(false);
          handleMouseUpOrLeave();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={() => {
          if (!activeAutoScroll) updateScrollBounds();
        }}
        className="w-full overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none"
        style={{
          touchAction: 'pan-y', // allows vertical page scroll while horizontally swiping
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          ref={trackRef}
          className="flex items-stretch gap-2 sm:gap-2.5 md:gap-3 py-1 sm:py-1.5 w-max"
        >
          {hasFliers ? (
            // Render Advert Fliers for rows 2 and 4 (3 promotions)
            fliers!.slice(0, 3).map((flier) => (
              <AdvertFlyerCard
                key={flier.id}
                flyer={flier}
                isDraggingRef={hasMovedRef}
              />
            ))
          ) : (
            // Render standard product cards
            displayedProducts.map(({ product, uniqueKey }) => (
              <SliderProductCard
                key={uniqueKey}
                product={product}
                isDraggingRef={hasMovedRef}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

