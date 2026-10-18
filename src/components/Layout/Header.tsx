'use client';

import React from 'react';
import { useApp } from '@/lib/themeContext';
import { ThemeToggle } from '@/components/UI/ThemeToggle';
import {
  RefreshCw,
  Plus,
  Users,
  ChevronDown,
  Send,
  Youtube,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  accounts?: any[];
  onOpenAddAccount?: () => void;
  onPublishNow?: () => void;
  isPublishing?: boolean;
}

export function Header({
  onRefresh,
  isRefreshing = false,
  accounts = [],
  onOpenAddAccount,
  onPublishNow,
  isPublishing = false,
}: HeaderProps) {
  const { selectedAccountId, setSelectedAccountId, setActiveTab } = useApp();

  const activeAccount =
    accounts.find((a) => a.id === selectedAccountId) ||
    accounts.find((a) => a.is_default) ||
    accounts[0] ||
    null;

  const isYouTube = activeAccount?.platform === 'youtube';

  return (
    <header className="px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60">
      {/* Left: Brand & Active Context */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Media Engine Cockpit
            </h1>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              v3.0.0
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {activeAccount ? (
              <>
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  {isYouTube ? (
                    <Youtube className="w-3.5 h-3.5 text-red-500 inline" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />
                  )}
                  @{activeAccount.handle}
                </span>
                <span>•</span>
                <span className="truncate max-w-[200px]">
                  {activeAccount.drive_folder_name || 'Mapped Drive Folder'}
                </span>
                <span>•</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  {activeAccount.posting_frequency || 3}/day
                </span>
              </>
            ) : (
              <span>All Systems Operational</span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Focused Controls */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Account Selector Pill */}
        <div className="relative">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Accounts ({accounts.length})</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.platform === 'youtube' ? '🔴 [YT]' : '📸 [IG]'} @{acc.handle}
              </option>
            ))}
          </select>
          <Users className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Primary Action Button: Clear Target! */}
        {onPublishNow && (
          <button
            onClick={onPublishNow}
            disabled={isPublishing}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-md disabled:opacity-50 transition-all ${
              isYouTube
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
            title={
              activeAccount
                ? `Publish next ready ${isYouTube ? 'short' : 'reel'} for @${activeAccount.handle}`
                : `Publish next ready video`
            }
          >
            {isPublishing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>
              {isPublishing
                ? 'Publishing...'
                : activeAccount && selectedAccountId !== 'all'
                ? isYouTube
                  ? `Publish Short (@${activeAccount.handle})`
                  : `Publish Reel (@${activeAccount.handle})`
                : 'Publish Next Video'}
            </span>
          </button>
        )}

        {/* Add Account Button */}
        <button
          onClick={() => {
            if (onOpenAddAccount) onOpenAddAccount();
            else setActiveTab('accounts');
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Account</span>
        </button>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-blue-500')} />
          </button>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
