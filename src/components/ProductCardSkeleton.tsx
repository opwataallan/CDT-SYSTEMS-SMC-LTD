import React from 'react';

interface ProductCardSkeletonProps {
  count?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ count = 1 }) => {
  const skeletons = Array.from({ length: count });

  if (count === 1) {
    return (
      <div
        className="flex flex-col bg-white rounded-lg p-1.5 sm:p-2 border border-slate-200/90 shadow-2xs animate-pulse select-none"
        aria-hidden="true"
      >
        {/* Top Badges & Wishlist Placeholders */}
        <div className="relative w-full pt-[78%] bg-slate-200 rounded overflow-hidden mb-1.5 flex items-center justify-center">
          <div className="absolute top-1.5 left-1.5 w-8 h-3.5 bg-slate-300 rounded" />
          <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-slate-300 rounded-full" />
        </div>

        {/* Brand & Stock Bar */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="h-3 w-14 bg-slate-200 rounded" />
          <div className="h-3 w-10 bg-slate-200 rounded" />
        </div>

        {/* Product Title Lines */}
        <div className="space-y-1 mb-2">
          <div className="h-3 w-full bg-slate-200 rounded" />
          <div className="h-3 w-3/4 bg-slate-200 rounded" />
        </div>

        {/* Rating Stars Line */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
            ))}
          </div>
          <div className="h-2.5 w-6 bg-slate-200 rounded" />
        </div>

        {/* Price Box */}
        <div className="mt-auto pt-1 border-t border-slate-100/80 space-y-1">
          <div className="h-4 w-20 bg-slate-200 rounded" />
          <div className="h-7 w-full bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      {skeletons.map((_, idx) => (
        <ProductCardSkeleton key={idx} count={1} />
      ))}
    </>
  );
};
