'use client';

import React from 'react';
import {
  Settings,
  MoreVertical,
  HardDrive,
  Flame,
  Clock,
  Film,
  Sparkles,
  ArrowUpRight,
  Play,
} from 'lucide-react';
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
  onPublishNow?: () => void;
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
  onPublishNow,
}: MetricCardsProps) {
  const bufferPercent = Math.min(100, Math.round((bufferCount / bufferTarget) * 100));
  const quotaPercent = Math.min(100, Math.round((quotaUsedToday / quotaLimit) * 100));
  const totalOperations = publishedCount + scheduledCount;
  const pipelineTarget = 25;
  const pipelinePercent = Math.min(100, Math.round((totalOperations / pipelineTarget) * 100));

  // Helper for pill segments (8 pills total)
  const renderPillMeter = (percent: number, filledColorClass: string, emptyColorClass: string) => {
    const totalPills = 8;
    const filledCount = Math.round((percent / 100) * totalPills);
    return (
      <div className="flex items-center gap-1.5 mt-4">
        {Array.from({ length: totalPills }).map((_, i) => (
          <div
            key={i}
            className={`h-7 w-4.5 rounded-full transition-all duration-300 ${
              i < filledCount ? filledColorClass : emptyColorClass
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. OPERATIONS / PUBLISHING PIPELINE CARD (Clean White / Dark Surface) */}
      <div className="p-6 rounded-[32px] bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Settings className="w-4 h-4" />
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Operations</span>
            </div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <div className="flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                {totalOperations}
              </span>
              <span className="text-sm font-semibold text-slate-400 font-sans ml-1">/{pipelineTarget}</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white">
              <span className="w-2 h-2 rounded-full border border-current" />
              <span>{pipelinePercent}%</span>
            </div>
          </div>
        </div>

        {/* Pill Meter */}
        <div>
          {renderPillMeter(
            pipelinePercent,
            'bg-[#121417] dark:bg-white',
            'border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent'
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{scheduledCount} queued • {publishedCount} published</span>
            <span className="font-mono text-[11px] text-emerald-500 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* 2. DATA BUFFER CARD (Electric Lime Accent Card matching reference #ddfc42) */}
      <div className="p-6 rounded-[32px] bg-[#e3fb45] text-slate-950 shadow-md flex flex-col justify-between relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-black/10 text-slate-950">
                <HardDrive className="w-4 h-4" />
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-950">Data Buffer (CDN)</span>
            </div>
            <button className="text-slate-950/60 hover:text-slate-950 p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <div className="flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-slate-950 font-sans">
                {bufferCount}
              </span>
              <span className="text-sm font-bold text-slate-950/60 font-sans ml-1">/{bufferTarget} Videos</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 border border-black/10 text-xs font-extrabold text-slate-950 shadow-sm">
              <span className="w-2 h-2 rounded-full border border-slate-950" />
              <span>{bufferPercent}%</span>
            </div>
          </div>
        </div>

        {/* Pill Meter */}
        <div>
          {renderPillMeter(
            bufferPercent,
            'bg-slate-950',
            'border-2 border-dashed border-black/20 bg-transparent'
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-950/80 font-semibold">
            <span>Hugging Face Edge Storage</span>
            <span className="font-mono text-[11px]">{bufferTarget - bufferCount} slots left</span>
          </div>
        </div>
      </div>

      {/* 3. PROMO / NEXT-UP BANNER CARD (Futuristic Dark aesthetic from reference) */}
      <div className="p-6 rounded-[32px] bg-[#0d1117] text-white border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
        {/* Subtle glow / cybernetic gradient overlay */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-purple-500/20 via-blue-500/20 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-mono uppercase tracking-wider text-slate-300 border border-white/10">
              Autonomous Engine
            </span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>

          <h3 className="text-lg font-bold tracking-tight text-white leading-snug pt-1">
            Take Your <br />
            Automation to the <br />
            Next Level
          </h3>
        </div>

        <div className="relative z-10 pt-4">
          <button
            onClick={onPublishNow}
            className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-black text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <span>Trigger Publisher</span>
            <Play className="w-3 h-3 fill-current ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
