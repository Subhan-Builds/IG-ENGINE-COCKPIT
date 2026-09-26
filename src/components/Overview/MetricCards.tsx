'use client';

import React from 'react';
import { Film, HardDrive, Layers, Clock, TrendingUp, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface MetricCardsProps {
  bufferCount: number;
  bufferTarget?: number;
  quotaUsedToday: number;
  quotaLimit?: number;
  sourceDriveCount?: number;
  scheduledCount: number;
  publishedCount: number;
  failedCount: number;
  overallHealth: string;
}

export function MetricCards({
  bufferCount,
  bufferTarget = 15,
  quotaUsedToday,
  quotaLimit = 100,
  sourceDriveCount = 100,
  scheduledCount,
  publishedCount,
  failedCount,
  overallHealth,
}: MetricCardsProps) {
  const bufferPercent = Math.min(100, Math.round((bufferCount / bufferTarget) * 100));
  const quotaPercent = Math.min(100, Math.round((quotaUsedToday / quotaLimit) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Rolling Storage Buffer */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">HF CDN Buffer</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            <HardDrive className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{bufferCount}</span>
          <span className="text-xs text-slate-400 font-mono">/ {bufferTarget} target</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              bufferPercent >= 80 ? 'bg-cyan-500' : bufferPercent >= 40 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${bufferPercent}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Public edge CDN</span>
          <span className="font-mono">{bufferPercent}% ready</span>
        </div>
      </div>

      {/* 2. Daily Meta Publishing Quota */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Today's Meta Quota</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{quotaUsedToday}</span>
          <span className="text-xs text-slate-400 font-mono">/ {quotaLimit} limit (24h)</span>
        </div>

        <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${Math.max(4, quotaPercent)}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Instagram Graph v21.0</span>
          <span className="font-mono text-emerald-500 font-medium">{quotaLimit - quotaUsedToday} remaining</span>
        </div>
      </div>

      {/* 3. Staged & Scheduled Pipeline */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Scheduled Queue</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{scheduledCount}</span>
          <span className="text-xs text-slate-400 font-mono">queued Reels</span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-medium">
            {publishedCount} published
          </span>
          {failedCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-medium">
              {failedCount} failed
            </span>
          )}
        </div>

        <div className="mt-2 text-[11px] text-slate-400">
          Auto-dispatched on 15m cycle
        </div>
      </div>

      {/* 4. Google Drive Master Library */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Drive Master Library</span>
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
            <Film className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{sourceDriveCount}</span>
          <span className="text-xs text-slate-400 font-mono">raw videos</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Connected via Service Account</span>
        </div>

        <div className="mt-2 text-[11px] text-slate-400">
          Unattended 6h importer pipeline
        </div>
      </div>
    </div>
  );
}
