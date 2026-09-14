import React, { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  aspectRatio?: string; // e.g. '1/1', '4/3', '16/9'
  priority?: boolean; // Set true for hero/above-the-fold images to prioritize loading
  containerClassName?: string;
  fallbackSrc?: string;
}

/**
 * Optimizes image URLs with modern WebP/AVIF format parameters and responsive dimension constraints.
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  quality: number = 80,
  format: 'webp' | 'avif' | 'auto' = 'auto'
): string {
  if (!url || typeof url !== 'string') return '';

  // Local assets or data URLs: return as-is
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }

  try {
    const parsed = new URL(url);

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
      return url.replace('/upload/', `/upload/${transform}/`);
    }

    // 3. WordPress / WooCommerce / Jetpack Images
    if (parsed.pathname.includes('/wp-content/uploads/')) {
      // If dynamic resizing is supported or query param based
      if (width) {
        parsed.searchParams.set('w', String(width));
        parsed.searchParams.set('quality', String(quality));
        if (format !== 'auto') {
          parsed.searchParams.set('format', format);
        }
        return parsed.toString();
      }
    }

    return url;
  } catch {
    return url;
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
  const [hasError, setHasError] = useState(false);

  // Reset states if src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const webpUrl = getOptimizedImageUrl(src, width, quality, 'webp');
  const avifUrl = getOptimizedImageUrl(src, width, quality, 'avif');
  const defaultUrl = getOptimizedImageUrl(src, width, quality, 'auto');

  // If loading failed and fallback provided, or render branded SVG fallback
  if (hasError) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={`${className} object-cover`}
          loading="lazy"
          decoding="async"
        />
      );
    }

    return (
      <div
        className={`w-full h-full min-h-[100px] flex flex-col items-center justify-center bg-slate-100/90 text-slate-400 p-2 select-none border border-slate-200/60 rounded ${containerClassName}`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <Cpu className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300 stroke-[1.5] mb-1" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 text-center line-clamp-1">
          CDT Hardware
        </span>
      </div>
    );
  }

  const imageElement = (
    <picture className="w-full h-full contents">
      {/* Modern AVIF format (smallest file size, highest fidelity) */}
      {avifUrl !== defaultUrl && (
        <source type="image/avif" srcSet={avifUrl} />
      )}

      {/* Universally supported WebP format (25-35% smaller than JPEG) */}
      {webpUrl !== defaultUrl && (
        <source type="image/webp" srcSet={webpUrl} />
      )}

      {/* Fallback Image with progressive onload transition */}
      <img
        src={defaultUrl}
        alt={alt}
        loading={priority ? 'eager' : (loading || 'lazy')}
        decoding={priority ? 'sync' : (decoding || 'async')}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </picture>
  );

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Skeleton Pulse Loader Placeholder */}
      {!isLoaded && !hasError && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-slate-200/80 animate-pulse flex items-center justify-center pointer-events-none z-0"
        >
          <div className="w-6 h-6 rounded-full bg-slate-300/60 animate-ping" />
        </div>
      )}

      {imageElement}
    </div>
  );
};
