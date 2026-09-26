'use client';

import React from 'react';
import { Cpu, CheckCircle2, XCircle, Clock, ExternalLink, HelpCircle } from 'lucide-react';
import { WorkerUsageReport } from '@/lib/github';

interface GitHubWorkerUsageProps {
  usage: WorkerUsageReport | null;
}

export function GitHubWorkerUsage({ usage }: GitHubWorkerUsageProps) {
  if (!usage) return null;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              GitHub Actions Worker Metrics
            </h3>
            <p className="text-[11px] text-slate-400">Ubuntu hosted runner capacity & consumption</p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
          Calculated Estimate
        </span>
      </div>

      {/* Capacity Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">Monthly Runner Consumption:</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white">
            {usage.totalMinutesUsed} / {usage.monthlyFreeQuotaMinutes} mins ({usage.percentQuotaUsed}%)
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${Math.max(2, usage.percentQuotaUsed)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Remaining: {usage.remainingQuotaMinutes} mins</span>
          <span>Avg run: {usage.averageRunSeconds}s</span>
        </div>
      </div>

      {/* Mini Run Status Summary */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-center">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-400">Total Runs</div>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">{usage.totalRuns}</div>
        </div>
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
          <div className="text-xs">Success</div>
          <div className="text-sm font-bold font-mono mt-0.5">{usage.successfulRuns}</div>
        </div>
        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
          <div className="text-xs">Failed</div>
          <div className="text-sm font-bold font-mono mt-0.5">{usage.failedRuns}</div>
        </div>
      </div>
    </div>
  );
}
