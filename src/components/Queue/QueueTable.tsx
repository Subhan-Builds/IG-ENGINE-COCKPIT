'use client';

import React, { useState } from 'react';
import { Search, Film, Clock, Edit3, RefreshCw, EyeOff, Play, Filter, ArrowUpDown } from 'lucide-react';
import { StatusBadge } from '@/components/UI/Badge';
import { formatBytes, formatDateTime, formatTimeUTC } from '@/lib/utils';
import { VideoModal } from './VideoModal';

interface QueueTableProps {
  videos: any[];
  onRefresh: () => void;
}

export function QueueTable({ videos, onRefresh }: QueueTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const statuses = [
    { id: 'all', label: 'All Items' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'hf_ready', label: 'Buffer Ready' },
    { id: 'published', label: 'Published' },
    { id: 'failed', label: 'Failed' },
    { id: 'skipped', label: 'Skipped' },
  ];

  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.drive_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.caption?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'failed') return v.status === 'publish_failed' || v.status === 'import_failed';
    return v.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by filename, caption, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {statuses.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111726] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 border-b border-slate-200/80 dark:border-slate-800/80 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Video / File</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Scheduled Slot (UTC)</th>
                <th className="py-3 px-4">Caption Preview</th>
                <th className="py-3 px-4 text-center">Attempts</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No videos match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredVideos.map((video) => (
                  <tr
                    key={video.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedVideo(video)}
                  >
                    {/* Video Name & Size */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <Film className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {video.drive_filename}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {formatBytes(video.drive_size_bytes)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <StatusBadge status={video.status} />
                    </td>

                    {/* Scheduled Time */}
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {video.scheduled_at ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{formatTimeUTC(video.scheduled_at)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>

                    {/* Caption Preview */}
                    <td className="py-3 px-4 max-w-xs text-slate-500 dark:text-slate-400 truncate">
                      {video.caption || <span className="italic text-slate-400">Using default template</span>}
                    </td>

                    {/* Publish Attempts */}
                    <td className="py-3 px-4 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                      {video.publish_attempts}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                      >
                        Inspect & Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onUpdated={onRefresh}
        />
      )}
    </div>
  );
}
