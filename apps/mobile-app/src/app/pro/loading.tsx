"use client";

import React from 'react';

/**
 * Loading skeleton for PRO Dashboard
 * Maintains visual consistency during data fetch
 */
export default function ProLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto min-h-screen py-6 px-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-8 w-40 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
        </div>
        <div className="h-12 w-24 bg-slate-200 rounded-full" />
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-slate-200 rounded-xl mb-3" />
            <div className="h-7 w-12 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Section Title Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-slate-200 rounded" />
        <div className="h-4 w-20 bg-slate-100 rounded" />
      </div>

      {/* Job Cards Skeleton */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="h-5 w-32 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-emerald-100 rounded-full" />
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-slate-200 rounded" />
              <div className="h-4 w-48 bg-slate-100 rounded" />
            </div>

            {/* Description */}
            <div className="space-y-2 mb-4">
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
              <div className="h-10 flex-1 bg-emerald-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
