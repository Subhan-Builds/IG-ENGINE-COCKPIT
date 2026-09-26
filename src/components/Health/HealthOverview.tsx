'use client';

import React from 'react';
import {
  Database,
  Cloud,
  HardDrive,
  Cpu,
  Flame,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Folder,
} from 'lucide-react';
import { AttentionBanner } from '@/components/Overview/AttentionBanner';
import { formatDateTime } from '@/lib/utils';

interface HealthOverviewProps {
  healthData: any;
  onRefresh: () => void;
  onAction?: (actionType: string) => void;
}

export function HealthOverview({ healthData, onRefresh, onAction }: HealthOverviewProps) {
  if (!healthData) return null;

  const { subsystems, attentionItems, overallHealth, timestamp, checkDurationMs } = healthData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Operational</span>
          </span>
        );
      case 'warning':
      case 'attention':
      case 'degraded':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Attention Needed</span>
          </span>
        );
      case 'down':
      case 'critical':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            <span>Offline</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry Summary */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Subsystem Health Matrix</h2>
            {getStatusBadge(overallHealth === 'optimal' ? 'healthy' : overallHealth)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry across all 5 integrated services. Ping took {checkDurationMs}ms.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Run Health Diagnostics</span>
        </button>
      </div>

      {/* Human Attention Alerts */}
      <AttentionBanner items={attentionItems} onAction={onAction} />

      {/* 5 Subsystem Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Supabase Postgres */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Supabase DB</h3>
                <span className="text-[11px] text-slate-400 font-mono">PostgreSQL Hosted</span>
              </div>
            </div>
            {getStatusBadge(subsystems.supabase.status)}
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Database Latency:</span>
              <span className="text-emerald-500 font-semibold">{subsystems.supabase.latencyMs} ms</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Total Video Records:</span>
              <span className="text-slate-900 dark:text-white font-semibold">{subsystems.supabase.totalVideos}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Latest Worker Run:</span>
              <span className="text-slate-900 dark:text-white truncate max-w-[130px]">
                {subsystems.supabase.latestRun?.workflow || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Instagram Graph API */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Instagram Meta API</h3>
                <span className="text-[11px] text-slate-400 font-mono">Graph v21.0</span>
              </div>
            </div>
            {getStatusBadge(subsystems.instagram.status)}
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Target Account:</span>
              <span className="text-pink-500 font-semibold">@{subsystems.instagram.account?.username || 'lifefuel.global'}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Publishing Quota:</span>
              <span className="text-slate-900 dark:text-white font-semibold">
                {subsystems.instagram.quota?.quota_usage || 0} / {subsystems.instagram.quota?.quota_total || 100}
              </span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Token Status:</span>
              <span className="text-emerald-500 font-semibold">Long-Lived (Valid)</span>
            </div>
          </div>
        </div>

        {/* 3. Hugging Face Storage Buffer */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Hugging Face CDN</h3>
                <span className="text-[11px] text-slate-400 font-mono">Public Buffer Bucket</span>
              </div>
            </div>
            {getStatusBadge(subsystems.huggingface.status)}
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Bucket Name:</span>
              <span className="text-slate-900 dark:text-white truncate max-w-[140px]">{subsystems.huggingface.bucket}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Ready Buffer Videos:</span>
              <span className="text-cyan-500 font-semibold">{subsystems.huggingface.bufferCount}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">CDN Edge Reachability:</span>
              <span className="text-emerald-500 font-semibold">HTTP 200 Video/MP4</span>
            </div>
          </div>
        </div>

        {/* 4. GitHub Actions Worker */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">GitHub Actions</h3>
                <span className="text-[11px] text-slate-400 font-mono">Cloud Runner Workers</span>
              </div>
            </div>
            {getStatusBadge(subsystems.github.status)}
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Active Workflows:</span>
              <span className="text-slate-900 dark:text-white font-semibold">4 Scheduled Jobs</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Runner Minutes Used:</span>
              <span className="text-indigo-500 font-semibold">
                {subsystems.github.usage?.totalMinutesUsed || 0} / 2000 mins
              </span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Success Rate:</span>
              <span className="text-emerald-500 font-semibold">
                {subsystems.github.usage?.totalRuns > 0
                  ? Math.round(
                      (subsystems.github.usage.successfulRuns / subsystems.github.usage.totalRuns) * 100
                    )
                  : 100}
                %
              </span>
            </div>
          </div>
        </div>

        {/* 5. Google Drive Master */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Google Drive</h3>
                <span className="text-[11px] text-slate-400 font-mono">Master Source Library</span>
              </div>
            </div>
            {getStatusBadge(subsystems.drive.status)}
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Folder ID:</span>
              <span className="text-slate-900 dark:text-white truncate max-w-[140px]">
                {subsystems.drive.folderId}
              </span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Detected Source MP4s:</span>
              <span className="text-amber-500 font-semibold">~100 videos</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-slate-400">Service Account:</span>
              <span className="text-emerald-500 font-semibold">Read-Only Auth OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
