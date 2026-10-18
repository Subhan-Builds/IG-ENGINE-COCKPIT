'use client';

import React, { useState, useEffect } from 'react';
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
  Clock,
  Users,
  Info,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FolderSync,
  Compass,
  Code2,
  Globe2,
  Lock,
  Layers,
  Heart,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { useApp } from '@/lib/themeContext';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';

export interface AccountConfig {
  id: string;
  name: string;
  handle: string;
  platform_account_id?: string;
  posting_frequency: number;
  posting_times: string[];
  posting_enabled: boolean;
  caption_template?: string;
  drive_folder_id?: string;
  drive_folder_name?: string;
}

interface SettingsViewProps {
  settings: Record<string, string>;
  accounts?: any[];
  onRefresh: () => void;
  onSaveSettings: (settingsMap: Record<string, string>) => Promise<void>;
  initialTab?: string;
}

export function SettingsView({
  settings,
  accounts = [],
  onRefresh,
  onSaveSettings,
  initialTab = 'accounts',
}: SettingsViewProps) {
  const { addToast, advancedMode, setAdvancedMode, selectedAccountId } = useApp();

  // Active subtab inside settings: 'account_<id>' | 'global' | 'about'
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>(() => {
    if (initialTab === 'about') return 'about';
    if (selectedAccountId && selectedAccountId !== 'all') {
      const match = accounts.find((a) => a.id === selectedAccountId);
      if (match) return `account_${match.id}`;
    }
    return accounts.length > 0 ? `account_${accounts[0].id}` : 'global';
  });

  // Global settings state
  const [globalFormData, setGlobalFormData] = useState<Record<string, string>>(settings);

  // Per-account settings state dictionary (keyed by account id)
  const [accountConfigs, setAccountConfigs] = useState<Record<string, AccountConfig>>({});

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

  // Sync state whenever accounts prop updates
  useEffect(() => {
    const map: Record<string, AccountConfig> = {};
    accounts.forEach((acc) => {
      map[acc.id] = {
        id: acc.id,
        name: acc.name || acc.handle,
        handle: acc.handle,
        platform_account_id: acc.platform_account_id,
        posting_frequency: acc.posting_frequency || 3,
        posting_times: acc.posting_times || ['09:00', '15:00', '20:00'],
        posting_enabled: acc.posting_enabled !== false,
        caption_template:
          acc.caption_template ||
          'Follow for daily motivation! #motivation #mindset #success #dailymotivation',
        drive_folder_id: acc.drive_folder_id || '',
        drive_folder_name: acc.drive_folder_name || 'Active Source Folder',
      };
    });
    setAccountConfigs(map);
  }, [accounts]);

  // Sync global form data when settings prop updates
  useEffect(() => {
    setGlobalFormData(settings);
  }, [settings]);

  const getSlotsForFrequency = (freq: number): string[] => {
    switch (freq) {
      case 1:
        return ['20:00'];
      case 2:
        return ['13:00', '20:00'];
      case 3:
        return ['09:00', '15:00', '20:00'];
      case 4:
        return ['09:00', '13:00', '17:00', '21:00'];
      case 5:
        return ['09:00', '12:00', '15:00', '18:00', '21:00'];
      case 10:
        return ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00', '21:30'];
      default: {
        const slots: string[] = [];
        const startHour = 8;
        const totalSpan = 14;
        for (let i = 0; i < freq; i++) {
          const h = Math.floor(startHour + (i * totalSpan) / freq);
          const m = Math.floor(((startHour + (i * totalSpan) / freq) % 1) * 60);
          slots.push(`${String(h).padStart(2, '0')}:${String(m < 30 ? 0 : 30).padStart(2, '0')}`);
        }
        return slots;
      }
    }
  };

  const handleAccountFrequencyChange = (accId: string, freqStr: string) => {
    const f = parseInt(freqStr, 10);
    setAccountConfigs((prev) => {
      const current = prev[accId];
      if (!current) return prev;
      const updated = { ...current, posting_frequency: f };
      if (!isNaN(f) && f > 0 && f <= 25) {
        updated.posting_times = getSlotsForFrequency(f);
      }
      return { ...prev, [accId]: updated };
    });
  };

  const handleAccountFieldChange = (accId: string, field: keyof AccountConfig, value: any) => {
    setAccountConfigs((prev) => {
      const current = prev[accId];
      if (!current) return prev;
      return { ...prev, [accId]: { ...current, [field]: value } };
    });
  };

  const handleSaveAccountConfig = async (accId: string) => {
    const config = accountConfigs[accId];
    if (!config) return;

    try {
      setIsSaving(true);
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_schedule',
          accountId: accId,
          posting_frequency: config.posting_frequency,
          posting_times: config.posting_times,
          caption_template: config.caption_template,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update schedule');
      }

      addToast(
        'success',
        `Settings Saved (@${config.handle})`,
        `Autonomous schedule updated to ${config.posting_frequency} posts/day.`
      );
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveSettings(globalFormData);
      addToast('success', 'Global Settings Updated', 'Edge buffer and infrastructure settings synchronized.');
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

  // Resolve current active account being edited
  const currentEditingAccount = accounts.find((a) => `account_${a.id}` === activeSettingsTab);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Navigation Switcher for Settings Scope */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Per-Account Tabs */}
          {accounts.map((acc) => {
            const isActive = activeSettingsTab === `account_${acc.id}`;
            const isYT = acc.platform === 'youtube';
            return (
              <button
                key={acc.id}
                onClick={() => setActiveSettingsTab(`account_${acc.id}`)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? isYT
                      ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isYT ? (
                  <Youtube className="w-3.5 h-3.5 text-red-100" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                )}
                <span>@{acc.handle}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    acc.posting_enabled ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
              </button>
            );
          })}

          {/* Global Infrastructure Tab */}
          <button
            onClick={() => setActiveSettingsTab('global')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              activeSettingsTab === 'global'
                ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Infrastructure</span>
          </button>

          {/* About & System Tab */}
          <button
            onClick={() => setActiveSettingsTab('about')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              activeSettingsTab === 'about'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About & Roadmap</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          {activeSettingsTab.startsWith('account_') ? 'Isolated Account Scope' : 'Engine System Scope'}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION A: ISOLATED PER-ACCOUNT SETTINGS
      ───────────────────────────────────────────────────────────────────────────── */}
      {currentEditingAccount && (
        <div className="space-y-6 animate-fadeIn">
          {/* Account Profile Summary Header */}
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center text-white text-base font-bold shadow-md">
                {currentEditingAccount.handle.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    @{currentEditingAccount.handle}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Autonomous Peer
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Platform Account ID: <span className="font-mono">{currentEditingAccount.platform_account_id}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSaveAccountConfig(currentEditingAccount.id)}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : `Save @${currentEditingAccount.handle}`}</span>
            </button>
          </div>

          {/* Schedule & Rules for This Account */}
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Posting Rules: @{currentEditingAccount.handle}
                </h3>
                <p className="text-xs text-slate-400">
                  Custom frequency and delivery slots in Pakistan Standard Time (PKT)
                </p>
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
                  value={accountConfigs[currentEditingAccount.id]?.posting_frequency || 3}
                  onChange={(e) =>
                    handleAccountFrequencyChange(currentEditingAccount.id, e.target.value)
                  }
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Daily Slots in PKT (Asia/Karachi)
                </label>
                <input
                  type="text"
                  value={
                    (accountConfigs[currentEditingAccount.id]?.posting_times || []).join(', ')
                  }
                  onChange={(e) =>
                    handleAccountFieldChange(
                      currentEditingAccount.id,
                      'posting_times',
                      e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    )
                  }
                  placeholder="09:00, 15:00, 20:00"
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Comma-separated HH:MM. Slots automatically balance when frequency changes.
                </span>
              </div>
            </div>

            {/* Mapped Source Folder Readout */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <HardDrive className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Source Folder: {currentEditingAccount.drive_folder_name || 'Active Folder'}
                  </span>
                  <p className="text-[11px] font-mono text-slate-400">
                    Drive ID: {currentEditingAccount.drive_folder_id || 'Not configured'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Swap folder in the Accounts tab
              </span>
            </div>
          </div>

          {/* Caption Template for This Account */}
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <FileText className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Default Caption & Hashtag Template
                </h3>
                <p className="text-xs text-slate-400">
                  Applied to Reels published on @{currentEditingAccount.handle} when no custom caption is set
                </p>
              </div>
            </div>

            <textarea
              rows={4}
              value={accountConfigs[currentEditingAccount.id]?.caption_template || ''}
              onChange={(e) =>
                handleAccountFieldChange(currentEditingAccount.id, 'caption_template', e.target.value)
              }
              placeholder="Write default caption and hashtags..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveAccountConfig(currentEditingAccount.id)}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs shadow-md transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION B: GLOBAL INFRASTRUCTURE & EDGE BUFFER SETTINGS
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeSettingsTab === 'global' && (
        <form onSubmit={handleSaveGlobal} className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Edge Buffer & Importer Architecture
                </h3>
                <p className="text-xs text-slate-400">
                  Controls Hugging Face storage buffer limits and Google Drive ingestion batch sizes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Hugging Face Target Buffer (Per Account)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={globalFormData.hf_buffer_target || '15'}
                  onChange={(e) =>
                    setGlobalFormData((prev) => ({ ...prev, hf_buffer_target: e.target.value }))
                  }
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Importer maintains up to this many videos in edge CDN buffer.
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Importer Batch Size (Drive → HF per cycle)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={globalFormData.hf_import_batch || '5'}
                  onChange={(e) =>
                    setGlobalFormData((prev) => ({ ...prev, hf_import_batch: e.target.value }))
                  }
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Limits bandwidth consumed per background worker dispatch.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Global Emergency Killswitch
                </label>
                <select
                  value={globalFormData.posting_enabled || 'true'}
                  onChange={(e) =>
                    setGlobalFormData((prev) => ({ ...prev, posting_enabled: e.target.value }))
                  }
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Enabled (Autonomous Publishing Operational)</option>
                  <option value="false">Paused (Halt All Scheduled Publishing System-Wide)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs shadow-md transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Infrastructure Settings'}</span>
              </button>
            </div>
          </div>

          {/* Advanced Control Surface */}
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Advanced Control Surface
                  </h3>
                  <p className="text-xs text-slate-400">Maintenance dispatches & emergency recovery</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Rescue Stuck Videos?',
                      message:
                        'Resets any videos stuck in intermediate locks back to scheduled and discovered states.',
                      action: handleResetStuckJobs,
                    })
                  }
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-left text-xs space-y-1 transition-all"
                >
                  <div className="font-semibold text-slate-900 dark:text-white">Rescue Stuck Videos</div>
                  <div className="text-[11px] text-slate-400">Unlock videos trapped in importing states</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Trigger Maintenance Workflow?',
                      message: 'Dispatches maintenance.yml on GitHub Actions to ping Supabase and check token runway.',
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
                  <div className="font-semibold text-slate-900 dark:text-white">Dispatch Maintenance</div>
                  <div className="text-[11px] text-slate-400">Keepalive ping and token verification</div>
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-1">
                Advanced operational controls and recovery routines are locked in standard mode.
              </p>
            )}
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION C: ABOUT & SYSTEM ROADMAP SECTION
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeSettingsTab === 'about' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Creator & Project Hero Card */}
          <div className="p-8 rounded-[32px] bg-gradient-to-br from-purple-900/40 via-[#111726] to-[#0c1017] border border-purple-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-500/10 via-pink-500/10 to-transparent rounded-bl-full pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-red-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Engine Architecture v3.0.0
                </span>
                <span className="text-xs font-mono text-slate-400">Multi-Platform Release</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Media Engine Ecosystem
                </h2>
                <p className="text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
                  Autonomous, zero-cost cloud architecture orchestrating multi-account and multi-platform video
                  distribution from Google Drive through Hugging Face edge storage, Supabase state management, GitHub
                  Actions cron runners, Meta Graph API v21.0 (Instagram Reels), and Google Cloud YouTube Data API v3
                  (YouTube Shorts).
                </p>
              </div>

              {/* Creator LinkedIn Badge */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    SM
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Subhan Malik</div>
                    <div className="text-[11px] text-slate-400">Creator & Lead Engineer</div>
                  </div>
                </div>

                <a
                  href="https://www.linkedin.com/in/subhan-malik-723b1743a/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Linkedin className="w-4 h-4 fill-current" />
                  <span>Connect on LinkedIn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Evolution Roadmap: From Single to Multi-Platform */}
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Compass className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Multi-Platform Syndication & Distribution Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Cross-platform syndication architecture
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-800/40 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <Globe2 className="w-4 h-4 text-blue-500" />
                <span>Multi-Platform Era Achieved</span>
              </div>
              <p>
                The engine began as an autonomous, single-account publisher and graduated to a{' '}
                <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                  Multi-Account Same-Platform Automation Tool
                </strong>. Today with v3.0.0, the engine operates as a full{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  Multi-Platform & Multi-Account Automation System
                </strong>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-pink-500/30 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Instagram Reels (Active)</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-red-500/30 flex items-center gap-2">
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">YouTube Shorts (Active)</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span className="text-slate-500 dark:text-slate-400">TikTok & FB Reels (Roadmap)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Version Changelog Matrix */}
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Code2 className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Version Matrix & Changelog</h3>
                <p className="text-xs text-slate-400">Milestones achieved across project development</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    v3.0.0 — Multi-Platform Cross-Ecosystem Era
                  </span>
                  <span className="text-[10px] text-emerald-500 font-semibold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Current Live
                  </span>
                </div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-[11px] space-y-1 pt-1">
                  <li>Multi-Platform Architecture: Native support for both Instagram Reels and YouTube Shorts.</li>
                  <li>Google Cloud Console OAuth 2.0 Integration: Installed desktop OAuth credentials for YouTube Data API v3.</li>
                  <li>Platform-Aware Filtering & Controls: Filter accounts by platform (All, Instagram, YouTube) with specialized cards.</li>
                  <li>YouTube Quota Management: 10,000 units/day quota allocation, Shorts metadata tagging, and auto-scheduling.</li>
                  <li>Zero Schedule Disruption: Retained slot refill engine and Google Drive folder swapping across platforms.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">v2.4.0 — Peer Multi-Account & Slot Refill</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Archived</span>
                </div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-[11px] space-y-1 pt-1">
                  <li>Equal Peer Architecture: Removed hardcoded primary badges and restrictions across all accounts.</li>
                  <li>Automatic Slot Refill Engine: Manual publishing immediately refills vacated slots to preserve cadence.</li>
                  <li>Per-Account Isolated Configuration: Independent time slots, frequency, folders, and captions.</li>
                  <li>Direct Meta Graph API v21.0 Publishing: Instant container polling with zero runner delay.</li>
                  <li>Verified GitHub Billable Telemetry: Actual monthly runtime (896 / 2,000 mins) replacing estimates.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">v2.0.0 — Multi-Account Store & CDN Buffer</span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Archived</span>
                </div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-[11px] space-y-1 pt-1">
                  <li>Supabase accounts registry for multi-account isolation.</li>
                  <li>MD5 checksum content hash deduplication across Google Drive and Hugging Face.</li>
                  <li>Rolling CDN edge storage in Hugging Face bucket.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Privacy Policy & Open Source Morals */}
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Lock className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Privacy Policy & Open-Source Ethics
                </h3>
                <p className="text-xs text-slate-400">Moral considerations and data integrity principles</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Although this system is currently private and passcode-protected, the future roadmap includes
                open-sourcing the architecture for creators and automation developers. Operating with integrity
                is foundational:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Zero Data Selling</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    No account tokens, media binaries, or metrics are ever shared, aggregated, or sold to third
                    parties.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-blue-500" />
                    <span>Self-Hosted Security</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tokens and private keys remain encrypted server-side and are never exported to public client
                    bundles.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Platform Respect</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Enforces strict 24-hour Meta rate limits, spacing buffers, and prevents platform spamming.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
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
