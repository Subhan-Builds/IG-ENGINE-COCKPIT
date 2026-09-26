'use client';

import React, { useState } from 'react';
import { Play, Pause, DownloadCloud, UploadCloud, Wrench, RefreshCw, AlertTriangle } from 'lucide-react';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { useApp } from '@/lib/themeContext';

interface QuickActionsProps {
  postingEnabled: boolean;
  onTogglePosting: () => void;
  failedCount?: number;
  onRefreshAll?: () => void;
}

export function QuickActions({
  postingEnabled,
  onTogglePosting,
  failedCount = 0,
  onRefreshAll,
}: QuickActionsProps) {
  const { addToast } = useApp();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  const handleTriggerWorkflow = async (workflowName: string, label: string) => {
    try {
      setLoadingAction(workflowName);
      const res = await fetch('/api/worker/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: workflowName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch workflow');

      addToast(
        'success',
        `Dispatched ${label}`,
        `GitHub Actions runner has been triggered. Check runs for execution logs.`
      );
      if (onRefreshAll) setTimeout(onRefreshAll, 3000);
    } catch (err: any) {
      addToast('error', `Failed to Trigger ${label}`, err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRetryFailed = async () => {
    try {
      setLoadingAction('retry');
      const res = await fetch('/api/videos/retry', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to retry');

      addToast('success', 'Retry Initiated', data.message || 'Failed videos have been reset for scheduling.');
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      addToast('error', 'Retry Failed', err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <div className="p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Direct Worker Dispatches
          </span>
          <span className="text-[11px] text-slate-400">Triggers real GitHub runner jobs</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Trigger Importer */}
          <button
            onClick={() =>
              setConfirmDialog({
                isOpen: true,
                title: 'Trigger Drive Importer Now?',
                message:
                  'This will dispatch the Importer GitHub Actions worker to scan Google Drive, upload up to 5 new MP4s to Hugging Face, and schedule them.',
                action: () => handleTriggerWorkflow('importer', 'Drive Importer'),
              })
            }
            disabled={!!loadingAction}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-800 dark:text-slate-200 text-xs font-medium transition-all group disabled:opacity-50"
          >
            <DownloadCloud className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <span>{loadingAction === 'importer' ? 'Dispatching...' : 'Run Importer'}</span>
          </button>

          {/* 2. Trigger Publisher */}
          <button
            onClick={() =>
              setConfirmDialog({
                isOpen: true,
                title: 'Trigger Instagram Publisher Now?',
                message:
                  'This will immediately run the Publisher worker to find the oldest due video and publish it to @lifefuel.global via Instagram Graph API.',
                action: () => handleTriggerWorkflow('publisher', 'Reels Publisher'),
              })
            }
            disabled={!!loadingAction}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-slate-800 dark:text-slate-200 text-xs font-medium transition-all group disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span>{loadingAction === 'publisher' ? 'Dispatching...' : 'Run Publisher'}</span>
          </button>

          {/* 3. Trigger Maintenance */}
          <button
            onClick={() =>
              setConfirmDialog({
                isOpen: true,
                title: 'Trigger System Maintenance?',
                message:
                  'This will refresh Instagram tokens, rescue any stuck jobs (>60m), and ping Supabase to prevent inactivity pause.',
                action: () => handleTriggerWorkflow('maintenance', 'Maintenance Worker'),
              })
            }
            disabled={!!loadingAction}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-slate-800 dark:text-slate-200 text-xs font-medium transition-all group disabled:opacity-50"
          >
            <Wrench className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span>{loadingAction === 'maintenance' ? 'Dispatching...' : 'Run Maintenance'}</span>
          </button>

          {/* 4. Retry Failed Videos */}
          <button
            onClick={handleRetryFailed}
            disabled={!!loadingAction || failedCount === 0}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all group disabled:opacity-40 ${
              failedCount > 0
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                : 'border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
            <span>Retry Failed ({failedCount})</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={async () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await confirmDialog.action();
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
