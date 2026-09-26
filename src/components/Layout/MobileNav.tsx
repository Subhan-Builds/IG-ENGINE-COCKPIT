'use client';

import React, { useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const { activeTab, setActiveTab } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainTabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Command', icon: LayoutDashboard },
    { id: 'queue', label: 'Queue', icon: Film },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'posts', label: 'Posts', icon: Layers },
  ];

  const secondaryTabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'experiments', label: 'Experiment Lab', icon: FlaskConical },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'settings', label: 'Engine Settings', icon: Settings },
  ];

  const handleSelect = (id: TabType) => {
    setActiveTab(id);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Bottom Dock for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#0c121e]/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all',
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{tab.label}</span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all',
            secondaryTabs.some((t) => t.id === activeTab)
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1">More</span>
        </button>
      </nav>

      {/* Drawer for secondary tabs */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
          />
          <div className="relative bg-white dark:bg-[#111726] border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-6 shadow-2xl z-10 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Navigation
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-6">
              {secondaryTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all',
                      isActive
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <Icon className="w-5 h-5 text-blue-500 shrink-0" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
