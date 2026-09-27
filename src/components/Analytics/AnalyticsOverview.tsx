'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Eye, Heart, MessageCircle, Bookmark, BarChart3, TrendingUp, Clock, ShieldCheck } from 'lucide-react';
import { formatNumber, formatTimePKT } from '@/lib/utils';
import { useApp } from '@/lib/themeContext';

interface AnalyticsOverviewProps {
  posts: any[];
}

export function AnalyticsOverview({ posts }: AnalyticsOverviewProps) {
  const { theme, selectedAccountId } = useApp();
  const isDark = theme === 'dark';

  // Filter posts by selected account
  const accountPosts = posts.filter((p) => {
    if (selectedAccountId === 'all') return true;
    const vidAcc = p.account_id || 'acc_lifefuel_01';
    return vidAcc === selectedAccountId;
  });

  // Calculate real aggregates from posts
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalSaved = 0;
  let totalInteractions = 0;
  let totalReach = 0;

  for (const p of accountPosts) {
    const m = p.liveMetrics;
    if (m) {
      totalViews += m.views || 0;
      totalLikes += m.like_count || 0;
      totalComments += m.comments_count || 0;
      totalSaved += m.saved || 0;
      totalInteractions += m.total_interactions || 0;
      totalReach += m.reach || 0;
    }
  }

  const sampleSize = accountPosts.length;
  const avgLikes = sampleSize > 0 ? (totalLikes / sampleSize).toFixed(1) : '0';
  const avgComments = sampleSize > 0 ? (totalComments / sampleSize).toFixed(1) : '0';

  // Construct chart data based on published posts
  const timeSeriesData = accountPosts
    .map((p, idx) => ({
      name: `Reel #${idx + 1}`,
      views: p.liveMetrics?.views || 0,
      reach: p.liveMetrics?.reach || 0,
      likes: p.liveMetrics?.like_count || 0,
      date: p.published_at
        ? new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Karachi',
            month: 'short',
            day: 'numeric',
          }).format(new Date(p.published_at))
        : `Day ${idx + 1}`,
    }))
    .reverse();

  // Dynamic slot performance calculation in Asia/Karachi (No hardcoded 3 slots!)
  const slotPerformance: Record<string, { views: number; count: number }> = {};

  for (const p of accountPosts) {
    const dateSource = p.scheduled_at || p.published_at;
    if (dateSource) {
      const d = new Date(dateSource);
      // Format hour in Asia/Karachi timezone
      const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        hour12: false,
      });
      const hourStr = hourFormatter.format(d);
      const slotKey = `${hourStr}:00 PKT`;

      if (!slotPerformance[slotKey]) {
        slotPerformance[slotKey] = { views: 0, count: 0 };
      }
      slotPerformance[slotKey].views += p.liveMetrics?.views || 0;
      slotPerformance[slotKey].count += 1;
    }
  }

  // Ensure default expected slots exist for visual balance if empty
  const defaultSlots = ['09:00 PKT', '13:00 PKT', '17:00 PKT', '21:00 PKT'];
  for (const s of defaultSlots) {
    if (!slotPerformance[s]) {
      slotPerformance[s] = { views: 0, count: 0 };
    }
  }

  const slotChartData = Object.entries(slotPerformance)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slot, data]) => ({
      slot,
      averageViews: data.count > 0 ? Math.round(data.views / data.count) : 0,
      postsSample: data.count,
    }));

  const strokeColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      {/* Sample Size Transparency Banner */}
      <div className="p-5 rounded-[24px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Observational Analytics based on verified Meta Graph API deliverable metrics.</span>
        </div>
        <span className="font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
          Sample Size: N = {sampleSize} published Reels
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <Eye className="w-4 h-4 text-blue-500 mx-auto" />
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {formatNumber(totalViews)}
          </div>
          <span className="text-[11px] text-slate-400">Total Plays</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <TrendingUp className="w-4 h-4 text-cyan-500 mx-auto" />
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {formatNumber(totalReach)}
          </div>
          <span className="text-[11px] text-slate-400">Total Reach</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <Heart className="w-4 h-4 text-rose-500 mx-auto" />
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {formatNumber(totalLikes)}
          </div>
          <span className="text-[11px] text-slate-400">Total Likes</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <MessageCircle className="w-4 h-4 text-indigo-500 mx-auto" />
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {formatNumber(totalComments)}
          </div>
          <span className="text-[11px] text-slate-400">Comments</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <Bookmark className="w-4 h-4 text-amber-500 mx-auto" />
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {formatNumber(totalSaved)}
          </div>
          <span className="text-[11px] text-slate-400">Saves</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
          <BarChart3 className="w-4 h-4 text-purple-500 mx-auto" />
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {formatNumber(totalInteractions)}
          </div>
          <span className="text-[11px] text-slate-400">Interactions</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plays & Reach Timeline */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Plays & Reach per Reel</h3>
              <p className="text-xs text-slate-400">Chronological performance of published Reels</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Plays
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Reach
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
                <XAxis dataKey="date" stroke={textColor} fontSize={11} tickLine={false} />
                <YAxis stroke={textColor} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#viewsGrad)" />
                <Area type="monotone" dataKey="reach" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#reachGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Slot Performance (PKT) */}
        <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Slot Efficiency (Asia/Karachi PKT)</h3>
              <p className="text-xs text-slate-400">Average Reel views segmented by Pakistan Standard Time slot</p>
            </div>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slotChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} vertical={false} />
                <XAxis dataKey="slot" stroke={textColor} fontSize={11} tickLine={false} />
                <YAxis stroke={textColor} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val} views (N=${item.payload.postsSample})`,
                    'Avg Plays',
                  ]}
                />
                <Bar dataKey="averageViews" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
