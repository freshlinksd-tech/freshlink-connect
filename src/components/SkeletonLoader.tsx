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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Cover Image & Avatar section */}
      <div className="relative rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200 h-64 md:h-80">
        <div className="w-full h-full bg-zinc-200" />
      </div>

      {/* User Details */}
      <div className="relative -mt-20 md:-mt-24 px-6 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200/80">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
          {/* Avatar frame */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-zinc-300 border-4 border-white shadow-md shrink-0" />
          
          <div className="text-center md:text-left space-y-3 pb-2">
            <div className="h-7 bg-zinc-200 rounded w-44 mx-auto md:mx-0" />
            <div className="h-3.5 bg-zinc-100 rounded w-32 mx-auto md:mx-0" />
            <div className="h-3.5 bg-zinc-100 rounded w-48 mx-auto md:mx-0" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 shrink-0 self-center md:self-end">
          <div className="h-10 bg-zinc-200 rounded-full w-24" />
          <div className="h-10 bg-zinc-200 rounded-full w-24" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 pb-3">
        <div className="h-4 bg-zinc-200 rounded w-20" />
        <div className="h-4 bg-zinc-100 rounded w-20" />
        <div className="h-4 bg-zinc-100 rounded w-20" />
      </div>

      {/* Posts Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="h-4 bg-zinc-200 rounded w-1/3" />
          <div className="h-32 bg-zinc-100 rounded-2xl w-full" />
          <div className="h-4 bg-zinc-200 rounded w-2/3" />
        </div>
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="h-4 bg-zinc-200 rounded w-1/3" />
          <div className="h-32 bg-zinc-100 rounded-2xl w-full" />
          <div className="h-4 bg-zinc-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
};
