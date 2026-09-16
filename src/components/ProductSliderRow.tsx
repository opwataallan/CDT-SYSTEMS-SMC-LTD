import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Pause, Play, Hand } from 'lucide-react';
import { Product } from '../types';
import { SliderProductCard } from './SliderProductCard';
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
}) => {
  const { products: storeProducts, setCurrentView } = useShop();

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // States for manual control & auto-scroll
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [singleSetWidth, setSingleSetWidth] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Refs for drag without re-renders
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
  }, [propProducts, storeProducts, categorySlug, filterCategorySlugs, maxProducts]);

  // For auto-scroll rows, repeat 3x to ensure smooth infinite wrap-around
  // For manual rows (sliders 2 and 4), do NOT repeat - strictly show the 3 products
  const displayedProducts = useMemo(() => {
    if (!autoScroll || rowProducts.length === 0) {
      return rowProducts.map((p, idx) => ({ product: p, uniqueKey: `${p.id}-row${rowNumber}-${idx}` }));
    }
    // Repeat 3 times for seamless wrapping
    return [
      ...rowProducts.map((p, idx) => ({ product: p, uniqueKey: `${p.id}-row${rowNumber}-set0-${idx}` })),
      ...rowProducts.map((p, idx) => ({ product: p, uniqueKey: `${p.id}-row${rowNumber}-set1-${idx}` })),
      ...rowProducts.map((p, idx) => ({ product: p, uniqueKey: `${p.id}-row${rowNumber}-set2-${idx}` })),
    ];
  }, [autoScroll, rowProducts, rowNumber]);

  // Update bounds for manual rows
  const updateScrollBounds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  // Calculate width of one single set of items for auto-scrolling
  const updateSingleSetWidth = useCallback(() => {
    if (!autoScroll || !trackRef.current) return;
    const totalWidth = trackRef.current.scrollWidth;
    const singleWidth = totalWidth / 3;
    setSingleSetWidth(singleWidth);

    // Position in the middle set initially so wrapping works seamlessly in both directions
    if (containerRef.current && singleWidth > 0 && containerRef.current.scrollLeft === 0) {
      containerRef.current.scrollLeft = singleWidth;
    }
  }, [autoScroll]);

  useEffect(() => {
    if (autoScroll) {
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
  }, [autoScroll, updateSingleSetWidth, updateScrollBounds, displayedProducts]);

  // IntersectionObserver to pause auto-scroll when offscreen (saves CPU & battery)
  useEffect(() => {
    if (!autoScroll) return;
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
  }, [autoScroll]);

  // Temporary interaction pause helper for auto-scroll
  const pauseTemporarily = useCallback((durationMs = 2500) => {
    if (!autoScroll) return;
    setIsInteracting(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, durationMs);
  }, [autoScroll]);

  // Mouse wheel horizontal scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        pauseTemporarily(2500);
        container.scrollLeft += e.deltaY * 0.9;
        if (!autoScroll) {
          updateScrollBounds();
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [autoScroll, pauseTemporarily, updateScrollBounds]);

  // Main animation frame loop - ONLY runs when autoScroll is true
  useEffect(() => {
    if (!autoScroll) return;
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
  }, [autoScroll, isPlaying, isHovered, isInteracting, singleSetWidth, speed, direction]);

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
      if (!autoScroll) {
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
        if (!autoScroll) {
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
  }, [autoScroll, pauseTemporarily, updateScrollBounds]);

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
    if (!autoScroll) {
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
      if (!autoScroll) {
        updateScrollBounds();
      }
    }
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = () => {
    pauseTemporarily(2500);
  };

  const handleTouchMove = () => {
    pauseTemporarily(2000);
    if (!autoScroll) {
      updateScrollBounds();
    }
  };

  const handleTouchEnd = () => {
    pauseTemporarily(2000);
    if (!autoScroll) {
      setTimeout(updateScrollBounds, 150);
    }
  };

  // Arrow step buttons
  const handleScrollLeft = () => {
    pauseTemporarily(3000);
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
      if (!autoScroll) {
        setTimeout(updateScrollBounds, 350);
      }
    }
  };

  const handleScrollRight = () => {
    pauseTemporarily(3000);
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      if (!autoScroll) {
        setTimeout(updateScrollBounds, 350);
      }
    }
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
      className="py-2.5 sm:py-3 border-b border-slate-100 last:border-b-0 overflow-hidden"
    >
      {/* Category Header with Row Number, Title, Scroll Mode Tag, and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
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
              {/* Distinct Badge for Manual Swipe Rows (Sliders 2 & 4) */}
              {!autoScroll && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                  <Hand className="w-2.5 h-2.5 text-amber-600" />
                  Manual Swipe • {rowProducts.length} Items
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

        {/* Controls: Auto-Scroll Play/Pause (for Rows 1, 3, 5), Left/Right Arrows, and View All */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {/* Play/Pause Button - ONLY for auto-scrolling rows (1, 3, 5) */}
            {autoScroll && (
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
              disabled={!autoScroll && !canScrollLeft}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                autoScroll || canScrollLeft
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-white shadow-2xs'
                  : 'text-slate-300 cursor-not-allowed opacity-40'
              }`}
              title="Previous products"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Right Nav Arrow */}
            <button
              type="button"
              onClick={handleScrollRight}
              disabled={!autoScroll && !canScrollRight}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                autoScroll || canScrollRight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-white shadow-2xs'
                  : 'text-slate-300 cursor-not-allowed opacity-40'
              }`}
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

      {/* Horizontal Track Container:
          - Rows 1, 3, 5: Auto-scrolls continuously with pause on hover/touch/drag
          - Rows 2, 4: Strict manual swipe and drag ONLY (no interval, no auto-movement)
      */}
      <div
        ref={containerRef}
        onMouseEnter={() => {
          if (autoScroll) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (autoScroll) setIsHovered(false);
          handleMouseUpOrLeave();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={() => {
          if (!autoScroll) updateScrollBounds();
        }}
        className="w-full overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none"
        style={{
          touchAction: 'pan-y', // allows smooth vertical page scrolling on mobile while swiping horizontally
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          ref={trackRef}
          className="flex items-stretch gap-1.5 sm:gap-2 md:gap-2.5 py-1 sm:py-1.5 w-max"
        >
          {displayedProducts.map(({ product, uniqueKey }) => (
            <SliderProductCard
              key={uniqueKey}
              product={product}
              isDraggingRef={hasMovedRef}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
