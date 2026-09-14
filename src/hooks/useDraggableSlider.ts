import { useRef, useState, useCallback, useEffect, MouseEvent } from 'react';

interface UseDraggableSliderOptions {
  enableWheelScroll?: boolean;
  onUserScroll?: () => void;
}

export function useDraggableSlider(options: UseDraggableSliderOptions = {}) {
  const { enableWheelScroll = true, onUserScroll } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    updateScrollState();
    const handleScroll = () => {
      updateScrollState();
      onUserScroll?.();
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, onUserScroll]);

  // Optional mouse wheel to horizontal scroll converter
  useEffect(() => {
    if (!enableWheelScroll) return;
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // If predominantly vertical scroll and not zooming
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey && !e.ctrlKey) {
        // Only prevent vertical scroll if slider can actually scroll in that direction
        const canScroll =
          (e.deltaY > 0 && el.scrollLeft < el.scrollWidth - el.clientWidth - 2) ||
          (e.deltaY < 0 && el.scrollLeft > 2);

        if (canScroll) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 0.9;
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [enableWheelScroll]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  }, []);

  // Global mousemove and mouseup listeners when dragging so drag doesn't get stuck when cursor leaves the element
  useEffect(() => {
    if (!isDragging) return;

    const onGlobalMouseMove = (e: globalThis.MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startXRef.current) * 1.5;
      if (Math.abs(walk) > 4) {
        hasMovedRef.current = true;
      }
      el.scrollLeft = scrollLeftRef.current - walk;
      onUserScroll?.();
    };

    const onGlobalMouseUp = () => {
      setIsDragging(false);
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 100);
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, [isDragging, onUserScroll]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const el = containerRef.current;
      if (!el) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startXRef.current) * 1.5;
      if (Math.abs(walk) > 4) {
        hasMovedRef.current = true;
      }
      el.scrollLeft = scrollLeftRef.current - walk;
      onUserScroll?.();
    },
    [isDragging, onUserScroll]
  );

  const handleMouseUpOrLeave = useCallback(() => {
    setIsDragging(false);
    // Keep hasMovedRef for a brief moment to allow onClick handlers to check it
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 80);
  }, []);

  const scrollByAmount = useCallback((amount: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  return {
    containerRef,
    isDragging,
    hasMovedRef,
    canScrollLeft,
    canScrollRight,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    scrollByAmount,
    updateScrollState,
  };
}
