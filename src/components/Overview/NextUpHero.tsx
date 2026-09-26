'use client';

import React, { useState, useEffect } from 'react';
import { Play, Clock, Sparkles, Send, Edit3, Film, ArrowUpRight } from 'lucide-react';
import { formatDateTime, formatBytes } from '@/lib/utils';

interface NextUpHeroProps {
  video: any | null;
  onTriggerPublish?: () => void;
  onEdit?: (video: any) => void;
}

export function NextUpHero({ video, onTriggerPublish, onEdit }: NextUpHeroProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!video?.scheduled_at) {
      setTimeLeft('No upcoming post');
      return;
    }

    const target = new Date(video.scheduled_at).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Due now (ready for next publisher cycle)');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [video?.scheduled_at]);

  if (!video) {
    return (
      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-[#111726]/60 border border-slate-200 dark:border-slate-800/80 text-center flex flex-col items-center justify-center">
        <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-3">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Video Scheduled</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          The buffer is currently waiting for new imports or all ready videos have been published.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-[#111726] dark:via-[#111726] dark:to-blue-950/20 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Video Metadata */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-semibold uppercase tracking-wider font-mono">
              Next Up in Pipeline
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Due: {formatDateTime(video.scheduled_at)}
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {video.drive_filename}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              <span>Size: {formatBytes(video.drive_size_bytes)}</span>
              <span>•</span>
              <span>Buffer: Hugging Face CDN Ready</span>
            </div>
          </div>

          {/* Caption Snippet */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300 max-w-2xl line-clamp-2 leading-relaxed">
            <span className="font-semibold text-slate-900 dark:text-white mr-1.5">Caption:</span>
            {video.caption || 'Using global motivation caption template.'}
          </div>

          {/* Live Countdown & Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-xs font-semibold">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Countdown: {timeLeft}</span>
            </div>

            {onTriggerPublish && (
              <button
                onClick={onTriggerPublish}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Immediately</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(video)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Caption / Slot</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Video CDN Stream Preview */}
        {video.hf_url && (
          <div className="w-full lg:w-72 shrink-0 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black aspect-[9/16] max-h-72 shadow-lg relative group">
            <video
              src={video.hf_url}
              controls
              preload="metadata"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
