import React, { useState, useEffect, useRef } from 'react';
import { Package } from 'lucide-react';
import { settingsService } from '../services/settingsService';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  aspectRatio?: string; // e.g. '1/1', '4/3', '16/9'
  priority?: boolean; // Set true for hero/above-the-fold images to prioritize loading
  containerClassName?: string;
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80';

/**
 * Optimizes image URLs with responsive dimension constraints and SSL upgrades.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  width?: number,
  quality: number = 80,
  format: 'webp' | 'avif' | 'auto' = 'auto'
): string {
  if (!url || typeof url !== 'string') return '';

  let sanitized = url.trim();

  // Upgrade insecure HTTP to HTTPS for cyberdynamictech.com and common hosts
  if (sanitized.startsWith('http://')) {
    if (
      sanitized.includes('cyberdynamictech.com') ||
      sanitized.includes('wp.com') ||
      sanitized.includes('unsplash.com')
    ) {
      sanitized = sanitized.replace('http://', 'https://');
    }
  }

  // Local assets or data URLs: return as-is
  if (sanitized.startsWith('data:') || sanitized.startsWith('blob:') || sanitized.startsWith('/')) {
    return sanitized;
  }

  try {
    const parsed = new URL(sanitized);

    // 1. Unsplash Images Optimization
    if (parsed.hostname.includes('unsplash.com')) {
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('q', String(quality));
      if (width) parsed.searchParams.set('w', String(width));
      if (format === 'webp') parsed.searchParams.set('fm', 'webp');
      else if (format === 'avif') parsed.searchParams.set('fm', 'avif');
      return parsed.toString();
    }

    // 2. Cloudinary Images Optimization
    if (parsed.hostname.includes('res.cloudinary.com')) {
      const transform = `f_${format === 'auto' ? 'auto' : format},q_auto:${quality}${width ? `,w_${width}` : ''}`;
      return sanitized.replace('/upload/', `/upload/${transform}/`);
    }

    // 3. WordPress / WooCommerce Images
    return sanitized;
  } catch {
    return sanitized;
  }
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 80,
  aspectRatio,
  priority = false,
  className = '',
  containerClassName = '',
  fallbackSrc,
  loading,
  decoding,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const effectiveFallback =
    fallbackSrc && fallbackSrc !== DEFAULT_FALLBACK_IMAGE
      ? fallbackSrc
      : settingsService.get('branding.default_product_placeholder') || DEFAULT_FALLBACK_IMAGE;

  const cleanSrc = getOptimizedImageUrl(src, width, quality, 'auto');
  const activeSrc = hasError
    ? effectiveFallback
    : useProxy && cleanSrc.includes('cyberdynamictech.com')
    ? `/api/image-proxy?url=${encodeURIComponent(cleanSrc)}`
    : cleanSrc || effectiveFallback;

  // Reset error state and check cache completion when src changes
  useEffect(() => {
    setHasError(false);
    setUseProxy(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [cleanSrc]);

  // If even fallback fails or no src at all, render graceful branded hardware placeholder
  if (hasError && !fallbackSrc) {
    return (
      <div
        className={`w-full h-full min-h-[100px] flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 select-none border border-slate-200 rounded ${containerClassName}`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <Package className="w-7 h-7 text-slate-300 stroke-[1.5] mb-1" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 text-center line-clamp-1">
          CDT Hardware
        </span>
      </div>
    );
  }

  // Determine if parent is absolute or relative
  const isAbsoluteParent = className.includes('absolute');
  const baseContainerClass = isAbsoluteParent
    ? 'absolute inset-0 w-full h-full'
    : 'relative w-full h-full';

  return (
    <div
      className={`${baseContainerClass} overflow-hidden flex items-center justify-center ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Background Pulse Loader while image loads */}
      {!isLoaded && !hasError && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center pointer-events-none z-0"
        >
          <div className="w-5 h-5 rounded-full bg-slate-200/80 animate-ping" />
        </div>
      )}

      <img
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        loading={priority ? 'eager' : (loading || 'lazy')}
        decoding={priority ? 'sync' : (decoding || 'async')}
        fetchPriority={priority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!useProxy && cleanSrc.includes('cyberdynamictech.com')) {
            setUseProxy(true);
          } else if (!hasError) {
            setHasError(true);
          }
        }}
        className={`${className} relative z-10 transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-80'
        }`}
        {...props}
      />
    </div>
  );
};
