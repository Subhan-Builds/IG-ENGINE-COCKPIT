'use client';

import React from 'react';
import { useApp, TabType } from '@/lib/themeContext';
import {
  LayoutDashboard,
  Film,
  Calendar,
  Layers,
  BarChart3,
  FlaskConical,
  Activity,
  Settings,
  Sparkles,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

interface SidebarProps {
  queueCount?: number;
  attentionCount?: number;
  publishedCount?: number;
  hasActiveExperiment?: boolean;
}

export function Sidebar({ queueCount = 0, attentionCount = 0, publishedCount = 0, hasActiveExperiment = false }: SidebarProps) {
  const { activeTab, setActiveTab, advancedMode } = useApp();

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    {
      id: 'queue',
      label: 'Queue & Videos',
      icon: Film,
      badge: queueCount > 0 ? queueCount : undefined,
      badgeColor: 'bg-blue-500/15 text-blue-500',
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    {
      id: 'posts',
      label: 'Published Posts',
      icon: Layers,
      badge: publishedCount > 0 ? publishedCount : undefined,
      badgeColor: 'bg-emerald-500/15 text-emerald-500',
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    {
      id: 'experiments',
      label: 'Experiment Lab',
      icon: FlaskConical,
      badge: hasActiveExperiment ? 'Active' : undefined,
      badgeColor: 'bg-purple-500/15 text-purple-400',
    },
    {
      id: 'health',
      label: 'Health & System',
      icon: Activity,
      badge: attentionCount > 0 ? attentionCount : undefined,
      badgeColor: 'bg-rose-500/15 text-rose-500 animate-pulse',
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-white/70 dark:bg-[#0c121e]/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/80 z-30 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200/70 dark:border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wider uppercase text-slate-900 dark:text-white">
                IG ENGINE
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-tight rounded bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
                PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Reels Cockpit</p>
          </div>
        </div>

        {/* Live Pulse */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-500 font-semibold uppercase">Live</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                isActive
                  ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                  )}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={cn(
                    'text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border border-current/20',
                    item.badgeColor || 'bg-slate-100 text-slate-600'
                  )}
                >
                  {item.badge}
                </span>
              )}

              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Advanced Mode & Account Footer */}
      <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/60 space-y-3">
        {advancedMode && (
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-500 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Advanced Mode Active</span>
          </div>
        )}

        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            LF
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              @lifefuel.global
            </div>
            <div className="text-[10px] text-slate-400 truncate">Instagram Media Creator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
