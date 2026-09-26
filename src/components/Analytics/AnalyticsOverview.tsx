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
import { formatNumber } from '@/lib/utils';
import { useApp } from '@/lib/themeContext';

interface AnalyticsOverviewProps {
  posts: any[];
}

export function AnalyticsOverview({ posts }: AnalyticsOverviewProps) {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  // Calculate real aggregates from posts
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalSaved = 0;
  let totalInteractions = 0;
  let totalReach = 0;

  for (const p of posts) {
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

  const sampleSize = posts.length;
  const avgLikes = sampleSize > 0 ? (totalLikes / sampleSize).toFixed(1) : '0';
  const avgComments = sampleSize > 0 ? (totalComments / sampleSize).toFixed(1) : '0';

  // Construct chart data based on published posts
  const timeSeriesData = posts.map((p, idx) => ({
    name: `Reel #${idx + 1}`,
    views: p.liveMetrics?.views || 0,
    reach: p.liveMetrics?.reach || 0,
    likes: p.liveMetrics?.like_count || 0,
    date: p.published_at ? new Date(p.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : `Day ${idx + 1}`,
  })).reverse();

  // Posting slot distribution performance
  const slotPerformance: Record<string, { views: number; count: number }> = {
    '09:00 UTC': { views: 0, count: 0 },
    '15:00 UTC': { views: 0, count: 0 },
    '20:00 UTC': { views: 0, count: 0 },
  };

  for (const p of posts) {
    if (p.scheduled_at) {
      const d = new Date(p.scheduled_at);
      const h = d.getUTCHours();
      let slotKey = '09:00 UTC';
      if (h >= 13 && h <= 17) slotKey = '15:00 UTC';
      else if (h >= 18) slotKey = '20:00 UTC';

      slotPerformance[slotKey].views += p.liveMetrics?.views || 0;
      slotPerformance[slotKey].count += 1;
    }
  }

  const slotChartData = Object.entries(slotPerformance).map(([slot, data]) => ({
    slot,
    averageViews: data.count > 0 ? Math.round(data.views / data.count) : 0,
    postsSample: data.count,
  }));

  const strokeColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      {/* Sample Size Transparency Banner */}
      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Observational Analytics based on verified Meta Graph API deliverable metrics.</span>
        </div>
        <span className="font-mono text-slate-500 dark:text-slate-400">Sample Size: N = {sampleSize} published Reels</span>
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Performance Over Time */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Plays & Reach Over Time</h3>
              <p className="text-xs text-slate-400">Evolution of Reels engagement across published dates</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} opacity={0.5} />
                <XAxis dataKey="date" stroke={textColor} fontSize={11} />
                <YAxis stroke={textColor} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#111726' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="reach" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorReach)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Posting Time Slot Performance */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Posting-Time Performance</h3>
              <p className="text-xs text-slate-400">Average plays observed per daily UTC slot</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slotChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={strokeColor} opacity={0.5} />
                <XAxis dataKey="slot" stroke={textColor} fontSize={11} />
                <YAxis stroke={textColor} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#111726' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="averageViews" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
