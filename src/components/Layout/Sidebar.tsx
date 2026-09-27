'use client';

import React from 'react';
import { useApp, TabType } from '@/lib/themeContext';
import {
  LayoutDashboard,
  Users,
  Film,
  Calendar,
  Layers,
  BarChart3,
  FlaskConical,
  Activity,
  Settings,
  Flame,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface SidebarProps {
  queueCount?: number;
  attentionCount?: number;
  publishedCount?: number;
  accountsCount?: number;
  hasActiveExperiment?: boolean;
}

export function Sidebar({
  queueCount = 0,
  attentionCount = 0,
  publishedCount = 0,
  accountsCount = 1,
  hasActiveExperiment = false,
}: SidebarProps) {
  const { activeTab, setActiveTab, selectedAccountId } = useApp();

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Users, badge: accountsCount },
    { id: 'content', label: 'Content', icon: Film },
    { id: 'queue', label: 'Queue', icon: Layers, badge: queueCount > 0 ? queueCount : undefined },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'posts', label: 'Posts', icon: Film, badge: publishedCount > 0 ? publishedCount : undefined },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'experiments', label: 'Experiments', icon: FlaskConical, badge: hasActiveExperiment ? '•' : undefined },
    { id: 'health', label: 'Health', icon: Activity, badge: attentionCount > 0 ? '!' : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col items-center w-20 shrink-0 h-[calc(100vh-32px)] my-4 ml-4 rounded-[32px] bg-[#11141a] text-white py-6 select-none z-30 justify-between shadow-2xl border border-slate-800">
      {/* Top Brand Mark */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1b202c] border border-slate-700/80 flex items-center justify-center text-white shadow-md">
          <Flame className="w-6 h-6 fill-current text-white" />
        </div>
      </div>

      {/* Vertical Icon Rail */}
      <nav className="flex flex-col items-center gap-2 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={cn(
                'relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all group',
                isActive
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

              {/* Pill Badge */}
              {item.badge !== undefined && (
                <span
                  className={cn(
                    'absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center',
                    isActive
                      ? 'bg-black text-white'
                      : 'bg-blue-500 text-white'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Avatar */}
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer border border-white/20"
          title={`Active: ${selectedAccountId === 'all' ? 'All Accounts' : selectedAccountId}`}
        >
          LF
        </div>
      </div>
    </aside>
  );
}
