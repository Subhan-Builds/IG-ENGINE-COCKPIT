'use client';

import React, { useState } from 'react';
import { ExternalLink, Heart, MessageCircle, Eye, Bookmark, Share2, Layers, ArrowUpDown } from 'lucide-react';
import { formatDateTime, formatNumber } from '@/lib/utils';

interface PublishedGridProps {
  posts: any[];
}

export function PublishedGrid({ posts }: PublishedGridProps) {
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'views'>('date');

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'likes') {
      const aL = a.liveMetrics?.like_count || 0;
      const bL = b.liveMetrics?.like_count || 0;
      return bL - aL;
    }
    if (sortBy === 'views') {
      const aV = a.liveMetrics?.views || 0;
      const bV = b.liveMetrics?.views || 0;
      return bV - aV;
    }
    // Default: date published
    const aDate = new Date(a.published_at || a.created_at).getTime();
    const bDate = new Date(b.published_at || b.created_at).getTime();
    return bDate - aDate;
  });

  if (posts.length === 0) {
    return (
      <div className="p-12 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 text-center py-16 space-y-3">
        <Layers className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Published Reels Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Reels published by the engine to @lifefuel.global will appear here along with live Meta Graph metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort & Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Published Reels Archive</h2>
          <p className="text-xs text-slate-400">{posts.length} published Reels verified on Instagram</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
          >
            <option value="date">Latest Published</option>
            <option value="likes">Most Likes</option>
            <option value="views">Most Plays / Views</option>
          </select>
        </div>
      </div>

      {/* Grid of Reels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPosts.map((post) => {
          const metrics = post.liveMetrics;
          const permalink = metrics?.permalink || `https://www.instagram.com/reel/${post.instagram_media_id}/`;

          return (
            <div
              key={post.id}
              className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111726] shadow-sm overflow-hidden flex flex-col justify-between group hover:border-blue-500/50 transition-all"
            >
              {/* Top: Video Player or Preview */}
              <div className="aspect-[9/16] max-h-72 w-full bg-black relative overflow-hidden flex items-center justify-center">
                {post.hf_url ? (
                  <video
                    src={post.hf_url}
                    controls
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-500 text-xs">Video preview unavailable</div>
                )}

                <div className="absolute top-3 right-3">
                  <a
                    href={permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors flex items-center gap-1 text-xs"
                    title="Open on Instagram"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Bottom: Details & Metrics */}
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{formatDateTime(post.published_at)}</span>
                    <span className="text-[10px] text-emerald-500 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      Live on Feed
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5 truncate">
                    {post.drive_filename}
                  </h3>
                </div>

                {/* Caption preview */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {post.caption || 'Follow for daily motivation! #motivation'}
                </p>

                {/* Live Meta Metrics */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                    <Eye className="w-3.5 h-3.5 text-blue-500 mx-auto" />
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {formatNumber(metrics?.views ?? 0)}
                    </div>
                    <span className="text-[10px] text-slate-400">Views</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                    <Heart className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {formatNumber(metrics?.like_count ?? 0)}
                    </div>
                    <span className="text-[10px] text-slate-400">Likes</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                    <MessageCircle className="w-3.5 h-3.5 text-indigo-500 mx-auto" />
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {formatNumber(metrics?.comments_count ?? 0)}
                    </div>
                    <span className="text-[10px] text-slate-400">Comments</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                    <Bookmark className="w-3.5 h-3.5 text-amber-500 mx-auto" />
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {formatNumber(metrics?.saved ?? 0)}
                    </div>
                    <span className="text-[10px] text-slate-400">Saves</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
