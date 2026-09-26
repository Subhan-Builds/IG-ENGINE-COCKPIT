'use client';

import React, { useState } from 'react';
import {
  Settings,
  Save,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Sliders,
  FileText,
  KeyRound,
  HardDrive,
  Flame,
} from 'lucide-react';
import { useApp } from '@/lib/themeContext';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';

interface SettingsViewProps {
  settings: Record<string, string>;
  onRefresh: () => void;
  onSaveSettings: (settingsMap: Record<string, string>) => Promise<void>;
}

export function SettingsView({ settings, onRefresh, onSaveSettings }: SettingsViewProps) {
  const { addToast, advancedMode, setAdvancedMode } = useApp();
  const [formData, setFormData] = useState<Record<string, string>>(settings);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveSettings(formData);
      addToast('success', 'Settings Saved', 'Engine configuration updated successfully in Supabase.');
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetStuckJobs = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/videos/retry', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast('success', 'Stuck Jobs Rescued', data.message || 'Reset stuck videos.');
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Core Automation Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Automation Rules</h3>
              <p className="text-xs text-slate-400">Controls publishing frequency and buffer thresholds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Daily Posting Frequency (Reels / Day)
              </label>
              <input
                type="number"
                min="1"
                max="25"
                value={formData.posting_frequency || '3'}
                onChange={(e) => handleChange('posting_frequency', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Hugging Face Buffer Target
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={formData.hf_buffer_target || '15'}
                onChange={(e) => handleChange('hf_buffer_target', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Import Batch Size (Drive → HF per run)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.hf_import_batch || '5'}
                onChange={(e) => handleChange('hf_import_batch', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Global Publishing Switch
              </label>
              <select
                value={formData.posting_enabled || 'true'}
                onChange={(e) => handleChange('posting_enabled', e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Enabled (Autonomous Publishing)</option>
                <option value="false">Paused (Hold All Posts)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Global Caption Template */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FileText className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Default Caption Template</h3>
              <p className="text-xs text-slate-400">Fallback caption and hashtags applied when a video has no custom caption</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <textarea
              rows={4}
              value={formData.caption_template || ''}
              onChange={(e) => handleChange('caption_template', e.target.value)}
              placeholder="Follow for daily motivation! #motivation #mindset #success"
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* 3. Advanced Mode & Danger Zone */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Advanced Control Surface</h3>
              <p className="text-xs text-slate-400">Dangerous operations & system maintenance</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAdvancedMode(!advancedMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              advancedMode
                ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {advancedMode ? 'Disable Advanced Mode' : 'Enable Advanced Mode'}
          </button>
        </div>

        {advancedMode ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold">Security Protection:</span> Secret credentials (Supabase Service Key, GitHub
              PAT, Meta Access Token, Google Service Account JSON) are guarded strictly on the server and are never
              sent to the browser bundle.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Rescue Stuck Videos?',
                    message:
                      'This will reset any videos stuck in importing (>60m) or publish_pending (>30m) back to discovered and scheduled states.',
                    action: handleResetStuckJobs,
                  })
                }
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-left text-xs space-y-1 transition-all"
              >
                <div className="font-semibold text-slate-900 dark:text-white">Rescue Stuck Videos</div>
                <div className="text-[11px] text-slate-400">Recover videos stuck in intermediate locks</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Trigger Daily Maintenance?',
                    message:
                      'This triggers maintenance.yml on GitHub Actions to ping Supabase, refresh Instagram token runway, and reconcile queues.',
                    action: async () => {
                      await fetch('/api/worker/trigger', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ workflow: 'maintenance' }),
                      });
                      addToast('success', 'Maintenance Triggered', 'Dispatched maintenance workflow.');
                    },
                  })
                }
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-left text-xs space-y-1 transition-all"
              >
                <div className="font-semibold text-slate-900 dark:text-white">Rotate Token / Ping DB</div>
                <div className="text-[11px] text-slate-400">Dispatch maintenance workflow immediately</div>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-2">
            Advanced operational controls, recovery routines, and parameter overrides are locked in safe everyday mode.
            Click "Enable Advanced Mode" to unlock them.
          </p>
        )}
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
    </div>
  );
}
