'use client';

import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { formatRelative, formatDateTime } from '@/lib/utils';

interface ActivityStreamProps {
  runs: any[];
}

export function ActivityStream({ runs }: ActivityStreamProps) {
  if (!runs || runs.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center py-8">
        <p className="text-xs text-slate-400">No recent worker executions recorded.</p>
      </div>
    );
  }

  const getWorkflowTitle = (wf: string) => {
    switch (wf) {
      case 'publish_due':
        return 'Reels Publisher';
      case 'import_drive_to_hf':
        return 'Drive Importer';
      case 'maintenance':
        return 'System Maintenance';
      default:
        return wf;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Recent Worker Activity
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Live Execution Feed</span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto pr-1">
        {runs.slice(0, 8).map((run) => {
          const isSuccess = run.status === 'completed';
          const isFailed = run.status === 'failed';
          const isRunning = run.status === 'running';

          return (
            <div key={run.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {isFailed && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                {isRunning && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}

                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {getWorkflowTitle(run.workflow)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {run.videos_processed > 0
                      ? `${run.videos_processed} video(s) processed`
                      : run.error_summary
                      ? run.error_summary
                      : '0 items processed'}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatRelative(run.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
