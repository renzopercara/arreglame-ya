"use client";

export default function ServiceCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm border border-slate-100 animate-pulse">
      <div className="relative mb-3 h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-200 to-slate-300">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      
      <div className="flex flex-col gap-2">
        {/* Title skeleton */}
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        
        {/* Provider skeleton */}
        <div className="h-4 w-1/2 rounded bg-slate-200" />
        
        {/* Price skeleton */}
        <div className="h-6 w-24 rounded-lg bg-slate-200 mt-2" />
      </div>
    </div>
  );
}

// Multiple skeletons for loading states
export function ServiceGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}
