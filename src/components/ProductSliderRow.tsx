import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Pause, Play, Hand, Smartphone } from 'lucide-react';
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
      {/* Category Header with Clean Title & Navigation Controls */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h2>

        {/* Controls: Left/Right Arrows and View All */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleScrollLeft}
            disabled={activeAutoScroll ? false : !canScrollLeft}
            className={`p-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer ${
              activeAutoScroll || canScrollLeft
                ? 'bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
            }`}
            title="Scroll left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleScrollRight}
            disabled={activeAutoScroll ? false : !canScrollRight}
            className={`p-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer ${
              activeAutoScroll || canScrollRight
                ? 'bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-50'
            }`}
            title="Scroll right"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* View All Button */}
          <button
            type="button"
            onClick={handleViewAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer ml-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
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
        className="w-full overflow-x-auto no-scrollbar scroll-smooth cursor-grab active:cursor-grabbing select-none touch-pan-x"
        style={{
          touchAction: 'pan-x pan-y',
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

