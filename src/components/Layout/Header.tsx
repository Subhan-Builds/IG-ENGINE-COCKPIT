'use client';

import React from 'react';
import { useApp } from '@/lib/themeContext';
import { ThemeToggle } from '@/components/UI/ThemeToggle';
import {
  RefreshCw,
  Plus,
  Settings,
  Sparkles,
  Clock,
  Users,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  postingEnabled?: boolean;
  onTogglePosting?: () => void;
  nextPostTime?: string | null;
  overallHealth?: 'optimal' | 'attention' | 'critical';
  accounts?: any[];
  onOpenAddAccount?: () => void;
}

export function Header({
  onRefresh,
  isRefreshing = false,
  postingEnabled = true,
  onTogglePosting,
  nextPostTime,
  overallHealth = 'optimal',
  accounts = [],
  onOpenAddAccount,
}: HeaderProps) {
  const {
    activeTab,
    setActiveTab,
    selectedAccountId,
    setSelectedAccountId,
  } = useApp();

  const activeAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <header className="px-6 pt-6 pb-4 flex flex-col gap-4">
      {/* Top Banner Row: Expressive Typography + Actions matching Ref-for-dashboard-ui-ux.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Expressive Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2">
            <span>Managing</span>
            <span className="inline-flex items-center justify-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs">
              ⚙️
            </span>
            <span>IG Engine</span>
            <span>and</span>
            <span className="inline-flex items-center justify-center p-1 rounded-full bg-[#e3fb45] text-slate-950 text-xs shadow-sm">
              ✨
            </span>
            <span>Workflows</span>
          </h1>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Account Selector Pill */}
          <div className="relative">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121620] text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accounts ({accounts.length})</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  @{acc.handle} {acc.is_default ? '(Primary)' : ''}
                </option>
              ))}
            </select>
            <Users className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Quick Add Action Pill button matching "+ Create a New Scenario" in reference */}
          <button
            onClick={() => {
              if (onOpenAddAccount) onOpenAddAccount();
              else setActiveTab('accounts');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#121417] dark:bg-white text-white dark:text-black font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>

          {/* Settings Pill Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121620] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
            title="Engine Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121620] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm disabled:opacity-50"
              title="Refresh Live Data"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-blue-500')} />
            </button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>

      {/* Horizontal Segmented Navigation Bar matching reference ("Organization", "Teams", "Users", ...) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'accounts', label: 'Accounts' },
          { id: 'content', label: 'Content' },
          { id: 'queue', label: 'Queue' },
          { id: 'calendar', label: 'Calendar' },
          { id: 'posts', label: 'Posts' },
          { id: 'analytics', label: 'Analytics' },
          { id: 'experiments', label: 'Experiment Lab' },
          { id: 'health', label: 'Health' },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 select-none',
                isActive
                  ? 'bg-[#121417] text-white dark:bg-white dark:text-black shadow-sm'
                  : 'bg-white/80 dark:bg-[#121620]/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-800/60'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
