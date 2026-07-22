/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const FeedPostSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm animate-pulse">
      {/* Post Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-zinc-200 rounded-full shrink-0" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-200 rounded w-28" />
            <div className="h-3 bg-zinc-100 rounded w-20" />
          </div>
        </div>
        <div className="h-7 bg-zinc-100 rounded-full w-16" />
      </div>

      {/* Title & Metadata */}
      <div className="space-y-3">
        <div className="h-6 bg-zinc-200 rounded w-3/4" />
        <div className="flex items-center gap-3">
          <div className="h-3.5 bg-zinc-100 rounded-full w-12" />
          <div className="h-3 bg-zinc-100 rounded w-24" />
        </div>
      </div>

      {/* Content lines */}
      <div className="space-y-2.5">
        <div className="h-3.5 bg-zinc-200 rounded w-full" />
        <div className="h-3.5 bg-zinc-200 rounded w-5/6" />
        <div className="h-3.5 bg-zinc-100 rounded w-2/3" />
      </div>

      {/* Media Box */}
      <div className="h-64 md:h-80 bg-zinc-200 rounded-2xl w-full" />

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
        <div className="flex items-center gap-5">
          <div className="h-4 bg-zinc-100 rounded w-10" />
          <div className="h-4 bg-zinc-100 rounded w-10" />
        </div>
        <div className="h-4 bg-zinc-100 rounded w-14" />
      </div>
    </div>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 animate-pulse" id="profile-skeleton-loader">
      {/* Cover Image Header Skeleton */}
      <div className="relative rounded-3xl overflow-hidden bg-zinc-200 dark:bg-stone-850 border border-zinc-200/80 dark:border-stone-800 h-48 md:h-64 lg:h-72">
        <div className="w-full h-full bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-stone-850 dark:via-stone-800 dark:to-stone-850" />
      </div>

      {/* User Avatar & Details Container */}
      <div className="relative -mt-16 md:-mt-20 px-4 md:px-6 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-stone-800">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
          {/* Avatar Ring Frame */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-zinc-300 dark:bg-stone-750 border-4 border-white dark:border-stone-900 shadow-xl" />
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-zinc-200 dark:bg-stone-800 border-2 border-white dark:border-stone-900" />
          </div>

          {/* User Name, Handle, Bio & Meta Badges */}
          <div className="text-center md:text-left space-y-3 pb-1 w-full max-w-lg">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="h-7 bg-zinc-300 dark:bg-stone-750 rounded-lg w-48" />
              <div className="h-5 bg-zinc-200 dark:bg-stone-800 rounded-full w-16" />
            </div>
            <div className="h-3.5 bg-zinc-200 dark:bg-stone-800 rounded-md w-32 mx-auto md:mx-0" />
            <div className="space-y-1.5 pt-1">
              <div className="h-3.5 bg-zinc-200 dark:bg-stone-800 rounded-md w-full" />
              <div className="h-3.5 bg-zinc-200 dark:bg-stone-800 rounded-md w-4/5 mx-auto md:mx-0" />
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
              <div className="h-6 bg-zinc-200 dark:bg-stone-800 rounded-full w-28" />
              <div className="h-6 bg-zinc-200 dark:bg-stone-800 rounded-full w-24" />
              <div className="h-6 bg-zinc-200 dark:bg-stone-800 rounded-full w-32" />
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex items-center justify-center gap-3 shrink-0 self-center md:self-end w-full md:w-auto">
          <div className="h-10 bg-zinc-300 dark:bg-stone-800 rounded-2xl w-32 shadow-xs" />
          <div className="h-10 bg-zinc-200 dark:bg-stone-850 rounded-2xl w-28 shadow-xs" />
        </div>
      </div>

      {/* Stats Metric Strip Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-white dark:bg-stone-900/60 border border-zinc-200/80 dark:border-stone-800 rounded-2xl space-y-2">
            <div className="h-3 bg-zinc-200 dark:bg-stone-800 rounded w-16" />
            <div className="h-6 bg-zinc-300 dark:bg-stone-750 rounded w-20" />
          </div>
        ))}
      </div>

      {/* Navigation Tabs Skeleton */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-stone-800 pb-3 overflow-x-auto no-scrollbar">
        <div className="h-9 bg-zinc-300 dark:bg-stone-750 rounded-xl w-28 shrink-0" />
        <div className="h-9 bg-zinc-200 dark:bg-stone-850 rounded-xl w-24 shrink-0" />
        <div className="h-9 bg-zinc-200 dark:bg-stone-850 rounded-xl w-24 shrink-0" />
        <div className="h-9 bg-zinc-200 dark:bg-stone-850 rounded-xl w-28 shrink-0" />
        <div className="h-9 bg-zinc-200 dark:bg-stone-850 rounded-xl w-24 shrink-0" />
      </div>

      {/* Authored Content Posts Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {[1, 2].map((card) => (
          <div key={card} className="bg-white dark:bg-stone-900 border border-zinc-200/80 dark:border-stone-800 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-200 dark:bg-stone-800 rounded-full" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-zinc-300 dark:bg-stone-750 rounded w-28" />
                  <div className="h-3 bg-zinc-200 dark:bg-stone-800 rounded w-20" />
                </div>
              </div>
              <div className="h-6 bg-zinc-200 dark:bg-stone-800 rounded-full w-14" />
            </div>
            <div className="space-y-2">
              <div className="h-5 bg-zinc-300 dark:bg-stone-750 rounded w-4/5" />
              <div className="h-3.5 bg-zinc-200 dark:bg-stone-800 rounded w-full" />
              <div className="h-3.5 bg-zinc-200 dark:bg-stone-800 rounded w-2/3" />
            </div>
            <div className="h-44 bg-zinc-200 dark:bg-stone-850 rounded-2xl w-full" />
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-stone-850">
              <div className="h-4 bg-zinc-200 dark:bg-stone-800 rounded w-16" />
              <div className="h-4 bg-zinc-200 dark:bg-stone-800 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
