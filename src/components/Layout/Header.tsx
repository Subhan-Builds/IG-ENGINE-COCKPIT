'use client';

import React from 'react';
import { useApp } from '@/lib/themeContext';
import { ThemeToggle } from '@/components/UI/ThemeToggle';
import { RefreshCw, Play, Pause, ShieldAlert, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  postingEnabled?: boolean;
  onTogglePosting?: () => void;
  nextPostTime?: string | null;
  overallHealth?: 'optimal' | 'attention' | 'critical';
}

export function Header({
  onRefresh,
  isRefreshing = false,
  postingEnabled = true,
  onTogglePosting,
  nextPostTime,
  overallHealth = 'optimal',
}: HeaderProps) {
  const { activeTab, advancedMode, setAdvancedMode } = useApp();

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Mission Command Center';
      case 'queue':
        return 'Video Library & Staging Queue';
      case 'calendar':
        return 'Publication Calendar & Slots';
      case 'posts':
        return 'Published Reels & Meta Deliverables';
      case 'analytics':
        return 'Performance Intelligence & Charts';
      case 'experiments':
        return 'Research Engine & Experiment Lab';
      case 'health':
        return 'System Health & Subsystem Diagnostics';
      case 'settings':
        return 'Engine Configuration & Parameters';
      default:
        return 'Cockpit';
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#0c121e]/80 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between">
      {/* Title & Status */}
      <div className="flex items-center gap-3">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          {getSectionTitle()}
        </h1>

        {/* Subsystem Health Pill */}
        <div
          className={cn(
            'hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
            overallHealth === 'optimal'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : overallHealth === 'attention'
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              overallHealth === 'optimal'
                ? 'bg-emerald-500'
                : overallHealth === 'attention'
                ? 'bg-amber-500'
                : 'bg-rose-500 animate-ping'
            )}
          />
          <span className="capitalize">{overallHealth}</span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Next Post Countdown indicator */}
        {nextPostTime && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400">Next Slot:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-200">{nextPostTime}</span>
          </div>
        )}

        {/* Global Pause/Resume Toggle */}
        {onTogglePosting && (
          <button
            onClick={onTogglePosting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-sm',
              postingEnabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
            )}
            title={postingEnabled ? 'Automation Active (Click to Pause)' : 'Automation Paused (Click to Resume)'}
          >
            {postingEnabled ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Active</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Paused</span>
              </>
            )}
          </button>
        )}

        {/* Advanced Mode Toggle */}
        <button
          onClick={() => setAdvancedMode(!advancedMode)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
            advancedMode
              ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 shadow-sm'
              : 'bg-slate-100/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          )}
          title="Toggle Advanced Configuration Mode"
        >
          <Sparkles className={cn('w-3.5 h-3.5', advancedMode ? 'text-amber-500 fill-current' : 'text-slate-400')} />
          <span className="hidden sm:inline">Advanced</span>
        </button>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all disabled:opacity-50"
            title="Refresh System Data"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-blue-500')} />
          </button>
        )}

        {/* Theme Toggle (Light / Dark) */}
        <ThemeToggle />
      </div>
    </header>
  );
}
