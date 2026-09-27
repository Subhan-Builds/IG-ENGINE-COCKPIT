'use client';

import React, { useState } from 'react';
import {
  Film,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatDateTimePKT, formatNumber } from '@/lib/utils';
import { useApp } from '@/lib/themeContext';

interface VideoItem {
  id: string;
  drive_file_id: string;
  drive_filename: string;
  drive_size_bytes?: number;
  status: string;
  hf_path?: string;
  hf_url?: string;
  caption?: string;
  scheduled_at?: string;
  published_at?: string;
  last_error?: string;
  instagram_media_id?: string;
  account_id?: string;
}

interface ContentViewProps {
  videos: VideoItem[];
  onSelectVideo: (video: VideoItem) => void;
  onRefresh: () => void;
}

export function ContentView({ videos, onSelectVideo, onRefresh }: ContentViewProps) {
  const { selectedAccountId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

  // Filter videos
  const filtered = videos.filter((v) => {
    // Account filtering
    if (selectedAccountId !== 'all') {
      const vidAcc = v.account_id || 'acc_lifefuel_01';
      if (vidAcc !== selectedAccountId) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.drive_filename.toLowerCase().includes(q) ||
        (v.caption && v.caption.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const statusCounts = {
    all: videos.length,
    hf_ready: videos.filter((v) => v.status === 'hf_ready').length,
    scheduled: videos.filter((v) => v.status === 'scheduled').length,
    published: videos.filter((v) => v.status === 'published').length,
    failed: videos.filter((v) => v.status === 'publish_failed' || v.status === 'import_failed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <Film className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Media Stream Architecture
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Content Pipeline & Edge Storage</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
            Authoritative tracking of video items from Google Drive master ingestion to Hugging Face CDN buffer, scheduled slots, and Meta Instagram publications.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('hf_ready')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              statusFilter === 'hf_ready'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Buffered ({statusCounts.hf_ready})
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              statusFilter === 'scheduled'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Scheduled ({statusCounts.scheduled})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              statusFilter === 'published'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Published ({statusCounts.published})
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search filenames or captions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Video Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((video) => {
          const isPublished = video.status === 'published';
          const isScheduled = video.status === 'scheduled';
          const isReady = video.status === 'hf_ready';
          const isFailed = video.status === 'publish_failed' || video.status === 'import_failed';

          return (
            <div
              key={video.id}
              className="p-5 rounded-[24px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div className="space-y-3">
                {/* Title & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate" title={video.drive_filename}>
                      {video.drive_filename}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {video.drive_size_bytes ? `${(video.drive_size_bytes / (1024 * 1024)).toFixed(1)} MB` : 'MP4 Reel'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase shrink-0 border ${
                      isPublished
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : isScheduled
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        : isReady
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                        : isFailed
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}
                  >
                    {video.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Caption / Snippet */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  {video.caption || 'No custom caption (inherits system default)'}
                </p>

                {/* Timing details */}
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
                  {video.scheduled_at && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Scheduled: {formatDateTimePKT(video.scheduled_at)}</span>
                    </div>
                  )}
                  {video.published_at && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Published: {formatDateTimePKT(video.published_at)}</span>
                    </div>
                  )}
                  {video.last_error && (
                    <div className="flex items-center gap-1.5 text-rose-500 truncate" title={video.last_error}>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{video.last_error}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {video.hf_url && (
                    <button
                      onClick={() => setActivePreviewUrl(video.hf_url || null)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Preview</span>
                    </button>
                  )}

                  {video.instagram_media_id && (
                    <a
                      href={`https://www.instagram.com/reel/${video.instagram_media_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      title="View on Instagram"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <button
                  onClick={() => onSelectVideo(video)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Edit Slot / Caption →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Preview Modal */}
      {activePreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setActivePreviewUrl(null)} className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-black rounded-3xl overflow-hidden shadow-2xl z-10 space-y-3 p-4">
            <div className="flex items-center justify-between text-white pb-2">
              <span className="text-xs font-mono">Hugging Face CDN Direct Stream</span>
              <button onClick={() => setActivePreviewUrl(null)} className="text-white hover:opacity-80">
                ✕
              </button>
            </div>
            <video
              src={activePreviewUrl}
              controls
              autoPlay
              className="w-full aspect-[9/16] rounded-2xl object-cover bg-slate-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
