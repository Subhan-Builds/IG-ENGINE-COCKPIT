'use client';

import React, { useState } from 'react';
import {
  Users,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  Settings2,
  Trash2,
  Power,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  HardDrive,
  FolderSync,
  Undo2,
  Sparkles,
  Youtube,
  Globe,
  Layers,
  Copy,
  Check,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { useApp } from '@/lib/themeContext';

export interface AccountItem {
  id: string;
  name: string;
  handle: string;
  platform: 'instagram' | 'facebook' | 'youtube' | 'tiktok';
  platform_account_id: string;
  account_type?: string;
  status: 'connected' | 'disconnected' | 'token_expired' | 'error';
  is_default: boolean;
  posting_frequency: number;
  posting_times: string[];
  posting_enabled: boolean;
  caption_template?: string;
  drive_folder_id?: string;
  drive_folder_name?: string;
  previous_drive_folder_id?: string;
  has_token?: boolean;
  quota?: {
    quota_total: number;
    quota_usage: number;
    remaining: number;
  };
  last_synced_at?: string;
}

interface AccountsViewProps {
  accounts: AccountItem[];
  onRefresh: () => void;
}

export function AccountsView({ accounts, onRefresh }: AccountsViewProps) {
  const { addToast } = useApp();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);

  // Platform view filter
  const [platformFilter, setPlatformFilter] = useState<'all' | 'instagram' | 'youtube'>('all');

  // Add Account Modal: active platform tab
  const [modalPlatform, setModalPlatform] = useState<'instagram' | 'youtube'>('instagram');

  // Expandable Help Guides
  const [showInstagramGuide, setShowInstagramGuide] = useState(false);
  const [showYouTubeGuide, setShowYouTubeGuide] = useState(true);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText('python scratch/authorize_youtube.py');
    setCopiedCommand(true);
    addToast('success', 'Command Copied!', 'Run "python scratch/authorize_youtube.py" in your PowerShell terminal.');
    setTimeout(() => setCopiedCommand(false), 3000);
  };

  // YouTube Connect Form states
  const [ytChannelId, setYtChannelId] = useState('');
  const [ytChannelTitle, setYtChannelTitle] = useState('');
  const [ytCustomUrl, setYtCustomUrl] = useState('');
  const [ytRefreshToken, setYtRefreshToken] = useState('');
  const [ytClientId, setYtClientId] = useState('');
  const [ytClientSecret, setYtClientSecret] = useState('');
  const [ytFreq, setYtFreq] = useState('2');
  const [ytTimes, setYtTimes] = useState('14:00, 20:00');
  const [isConnectingYt, setIsConnectingYt] = useState(false);

  // Form states for manual token connect
  const [tokenInput, setTokenInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [freqInput, setFreqInput] = useState('3');
  const [timesInput, setTimesInput] = useState('09:00, 15:00, 20:00');
  const [isValidating, setIsValidating] = useState(false);

  // Config modal states
  const [editFreq, setEditFreq] = useState(3);
  const [editTimes, setEditTimes] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Folder modal states
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderInput, setFolderInput] = useState('');
  const [isValidatingFolder, setIsValidatingFolder] = useState(false);
  const [folderValidationResult, setFolderValidationResult] = useState<any | null>(null);
  const [isSavingFolder, setIsSavingFolder] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState<string | null>(null);
  const [autoVerifyOnSwap, setAutoVerifyOnSwap] = useState(true);

  const handlePostVerificationReel = async (account: AccountItem) => {
    try {
      setIsVerifyingAccount(account.id);
      addToast('info', 'Publishing Verification Reel...', `Picking 1 ready video from folder for @${account.handle} and publishing live...`);
      const res = await fetch('/api/videos/verify-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: account.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post verification reel');

      addToast(
        'success',
        'Verification Reel Live on Instagram!',
        `Reel '${data.filename}' successfully posted to @${account.handle}! Media ID: ${data.mediaId}`
      );
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Verification Failed', err.message);
    } finally {
      setIsVerifyingAccount(null);
    }
  };

  const handleOpenFolderModal = (account: AccountItem) => {
    setSelectedAccount(account);
    setFolderInput(account.drive_folder_id || '');
    setFolderValidationResult(null);
    setIsFolderModalOpen(true);
  };

  const handleValidateFolder = async () => {
    if (!folderInput.trim()) {
      addToast('warning', 'Missing Folder', 'Please enter a Google Drive folder URL or ID.');
      return;
    }
    try {
      setIsValidatingFolder(true);
      setFolderValidationResult(null);
      const res = await fetch('/api/drive/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folderInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to validate folder');
      }
      setFolderValidationResult(data);
      addToast('success', 'Folder Validated', `Found ${data.videoCount} MP4 videos in '${data.folderName}'`);
    } catch (err: any) {
      setFolderValidationResult({ valid: false, error: err.message });
      addToast('error', 'Folder Inaccessible', err.message);
    } finally {
      setIsValidatingFolder(false);
    }
  };

  const handleSaveDriveFolder = async () => {
    if (!selectedAccount) return;
    const folderId = folderValidationResult?.folderId || folderInput.trim();
    const folderName = folderValidationResult?.folderName || 'Custom Source Folder';

    try {
      setIsSavingFolder(true);
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_folder',
          accountId: selectedAccount.id,
          drive_folder_id: folderId,
          drive_folder_name: folderName,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update folder mapping');
      }
      addToast('success', 'Source Folder Swapped!', `Successfully mapped @${selectedAccount.handle} to '${folderName}'`);
      setIsFolderModalOpen(false);
      onRefresh();
      if (autoVerifyOnSwap) {
        setTimeout(() => {
          handlePostVerificationReel(selectedAccount);
        }, 800);
      }
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    } finally {
      setIsSavingFolder(false);
    }
  };

  const handleRollbackFolder = async (rollbackFolderId: string) => {
    if (!selectedAccount || !rollbackFolderId) return;
    try {
      setIsSavingFolder(true);
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_folder',
          accountId: selectedAccount.id,
          drive_folder_id: rollbackFolderId,
          drive_folder_name: 'Previous Source Folder',
        }),
      });
      if (!res.ok) throw new Error('Rollback failed');
      addToast('success', 'Folder Rolled Back', `Restored previous folder for @${selectedAccount.handle}`);
      setIsFolderModalOpen(false);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Rollback Failed', err.message);
    } finally {
      setIsSavingFolder(false);
    }
  };

  const handleOpenConfig = (account: AccountItem) => {
    setSelectedAccount(account);
    setEditFreq(account.posting_frequency || 3);
    setEditTimes((account.posting_times || []).join(', '));
    setEditCaption(account.caption_template || '');
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    try {
      setIsSavingConfig(true);
      const parsedTimes = editTimes
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_schedule',
          accountId: selectedAccount.id,
          posting_frequency: editFreq,
          posting_times: parsedTimes,
          caption_template: editCaption,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update schedule');
      }

      addToast('success', 'Schedule Updated', `Configured schedule for @${selectedAccount.handle}`);
      setIsConfigModalOpen(false);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleToggleAccount = async (account: AccountItem) => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          accountId: account.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to toggle account');
      addToast(
        account.posting_enabled ? 'warning' : 'success',
        account.posting_enabled ? 'Automation Paused' : 'Automation Resumed',
        `Automated posting for @${account.handle} is now ${account.posting_enabled ? 'paused' : 'active'}.`
      );
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Toggle Failed', err.message);
    }
  };

  const handleDisconnect = async (account: AccountItem) => {
    if (accounts.length <= 1) {
      addToast('warning', 'Minimum 1 Account Required', 'Cannot disconnect the only active account in the engine.');
      return;
    }
    if (!confirm(`Are you sure you want to disconnect @${account.handle}?`)) return;

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect',
          accountId: account.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      addToast('success', 'Account Disconnected', `@${account.handle} has been removed.`);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Disconnect Failed', err.message);
    }
  };

  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      addToast('warning', 'Missing Token', 'Please provide a valid Instagram access token.');
      return;
    }

    try {
      setIsValidating(true);
      const parsedTimes = timesInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_and_connect',
          token: tokenInput.trim(),
          nameOverride: nameInput.trim() || undefined,
          frequency: parseInt(freqInput, 10) || 3,
          times: parsedTimes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Token validation failed');

      addToast(
        'success',
        'Account Connected Live!',
        `Successfully linked Instagram account @${data.account.handle} (ID: ${data.account.platform_account_id})`
      );

      setIsConnectModalOpen(false);
      setTokenInput('');
      setNameInput('');
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Connection Failed', err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleConnectYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytChannelId.trim() || !ytRefreshToken.trim()) {
      addToast('warning', 'Missing Information', 'YouTube Channel ID and Refresh Token are required.');
      return;
    }

    try {
      setIsConnectingYt(true);
      const parsedTimes = ytTimes
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect_youtube',
          channelId: ytChannelId.trim(),
          channelTitle: ytChannelTitle.trim() || undefined,
          customUrl: ytCustomUrl.trim() || undefined,
          refreshToken: ytRefreshToken.trim(),
          clientId: ytClientId.trim() || undefined,
          clientSecret: ytClientSecret.trim() || undefined,
          frequency: parseInt(ytFreq, 10) || 2,
          times: parsedTimes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect YouTube channel');

      addToast(
        'success',
        'YouTube Channel Connected Live!',
        `Successfully linked YouTube Shorts channel @${data.account.handle} (ID: ${data.account.platform_account_id})`
      );

      setIsConnectModalOpen(false);
      setYtChannelId('');
      setYtRefreshToken('');
      onRefresh();
    } catch (err: any) {
      addToast('error', 'YouTube Connection Failed', err.message);
    } finally {
      setIsConnectingYt(false);
    }
  };

  const igCount = accounts.filter((a) => a.platform === 'instagram').length;
  const ytCount = accounts.filter((a) => a.platform === 'youtube').length;
  const filteredAccounts = accounts.filter((acc) => {
    if (platformFilter === 'all') return true;
    return acc.platform === platformFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Multi-Platform Ecosystem */}
      <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-indigo-500 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Multi-Platform Ecosystem (v3.0.0)
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Connected Platform Accounts</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
            Centralized autonomous content distribution across Instagram Reels and YouTube Shorts, each with its own
            independent schedule, Drive source folder, and quota runway.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Platform Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setPlatformFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold border transition-all ${
            platformFilter === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
              : 'bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>All Platforms</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-500/20 font-mono">
            {accounts.length}
          </span>
        </button>

        <button
          onClick={() => setPlatformFilter('instagram')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold border transition-all ${
            platformFilter === 'instagram'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-sm'
              : 'bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          <span>Instagram Reels</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-pink-500/20 font-mono">
            {igCount}
          </span>
        </button>

        <button
          onClick={() => setPlatformFilter('youtube')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold border transition-all ${
            platformFilter === 'youtube'
              ? 'bg-red-600 text-white border-red-500 shadow-sm'
              : 'bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Youtube className="w-3.5 h-3.5" />
          <span>YouTube Shorts</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500/20 font-mono">
            {ytCount}
          </span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] font-medium bg-slate-100 dark:bg-slate-900 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
          <span>TikTok & FB Reels</span>
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
            Roadmap
          </span>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAccounts.map((acc, idx) => {
          const isYouTube = acc.platform === 'youtube';
          const quota = isYouTube
            ? { quota_total: 10000, quota_usage: 0, remaining: 10000 }
            : acc.quota || { quota_total: 100, quota_usage: 0, remaining: 100 };
          const quotaPercent = Math.min(100, Math.round((quota.quota_usage / quota.quota_total) * 100));

          return (
            <div
              key={acc.id}
              className={`p-6 rounded-[28px] border bg-white dark:bg-[#111726] shadow-sm transition-all ${
                isYouTube ? 'border-red-500/30' : 'border-slate-200/80 dark:border-slate-800/80'
              }`}
            >
              {/* Account Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-md ${
                      isYouTube
                        ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 shadow-red-600/20'
                        : 'bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 shadow-rose-500/20'
                    }`}
                  >
                    {isYouTube ? <Youtube className="w-6 h-6" /> : acc.handle.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {acc.name || `@${acc.handle}`}
                      </h3>
                    </div>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">@{acc.handle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border uppercase ${
                          isYouTube
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                        }`}
                      >
                        {isYouTube ? 'YouTube Shorts' : 'Instagram Reels'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleAccount(acc)}
                    className={`p-2 rounded-xl border transition-colors ${
                      acc.posting_enabled
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                    }`}
                    title={acc.posting_enabled ? 'Click to Pause Posting' : 'Click to Resume Posting'}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenConfig(acc)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Configure Schedule"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>

                  {accounts.length > 1 && (
                    <button
                      onClick={() => handleDisconnect(acc)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Disconnect Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quota & Schedule Grid */}
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                {/* Meta Daily Quota */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Meta Quota</span>
                    <Flame className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{quota.quota_usage}</span>
                    <span className="text-[11px] text-slate-400">/ {quota.quota_total} (24h)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(4, quotaPercent)}%` }} />
                  </div>
                </div>

                {/* Schedule Rule */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Schedule (PKT)</span>
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {acc.posting_frequency} / day
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {(acc.posting_times || []).join(', ')} PKT
                  </p>
                </div>
              </div>

              {/* Content Source Folder Mapping */}
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 w-full sm:w-auto">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                    <HardDrive className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Folder:</span>
                      <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 font-bold truncate">
                        {acc.drive_folder_name || 'Active Source Folder'}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      ID: {acc.drive_folder_id || '1VC5hQbbCsNk9LN1CbHshvDZ6CwxxmmOi'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800/60">
                  <button
                    onClick={() => handlePostVerificationReel(acc)}
                    disabled={isVerifyingAccount === acc.id}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold text-[11px] shrink-0 transition-colors shadow-sm flex items-center gap-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/60 disabled:opacity-50"
                    title={isYouTube ? "Publish 1 sample short to YouTube right now for instant visual verification" : "Publish 1 sample reel to Instagram right now for instant visual verification"}
                  >
                    {isVerifyingAccount === acc.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-500" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    )}
                    <span>{isVerifyingAccount === acc.id ? 'Posting...' : isYouTube ? 'Verify & Post 1 Short' : 'Verify & Post 1 Reel'}</span>
                  </button>
                  <button
                    onClick={() => handleOpenFolderModal(acc)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 font-semibold text-[11px] shrink-0 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <FolderSync className="w-3.5 h-3.5 text-blue-500" />
                    <span>Swap Folder</span>
                  </button>
                </div>
              </div>

              {/* Status details footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">ID: {acc.platform_account_id}</span>
                <span className="font-mono">Engine: {acc.posting_enabled ? 'Autonomous' : 'Paused'}</span>
              </div>
            </div>
          );
        })}

        {/* Account #2 Placeholder Card if only 1 account exists */}
        {accounts.length < 2 && (
          <div className="p-6 rounded-[28px] border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Account #2 Available</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                Expand your automation footprint. Connect your second Instagram account via Meta OAuth or direct access token.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                Connect Account #2
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsConnectModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Platform Account</h3>
                <p className="text-xs text-slate-400">Add an autonomous account to the Engine Ecosystem</p>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Platform Selection Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setModalPlatform('instagram')}
                className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                  modalPlatform === 'instagram'
                    ? 'bg-white dark:bg-[#111726] text-pink-600 dark:text-pink-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                <span>Instagram Reels</span>
              </button>
              <button
                type="button"
                onClick={() => setModalPlatform('youtube')}
                className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                  modalPlatform === 'youtube'
                    ? 'bg-white dark:bg-[#111726] text-red-600 dark:text-red-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>YouTube Shorts</span>
              </button>
            </div>

            {/* ─── YOUTUBE CONNECTION PANEL ─── */}
            {modalPlatform === 'youtube' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Expandable YouTube Guide Accordion */}
                <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setShowYouTubeGuide(!showYouTubeGuide)}
                    className="w-full p-3.5 flex items-center justify-between font-bold text-red-700 dark:text-red-400 hover:bg-red-100/40 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-red-600" />
                      <span>How to Connect YouTube (Read First)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      <span>{showYouTubeGuide ? 'Hide Guide' : 'Show Guide'}</span>
                      {showYouTubeGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                  {showYouTubeGuide && (
                    <div className="p-4 pt-1 space-y-2.5 text-[11px] text-slate-600 dark:text-slate-300 border-t border-red-100 dark:border-red-900/30 leading-relaxed">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-red-200/60 dark:border-red-900/40 space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-500" />
                          <span>Why Google does NOT have a copy-paste token like Meta:</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">
                          Google Cloud never displays a permanent &quot;Refresh Token&quot; in the web console for security. You must authorize through Google&apos;s interactive OAuth screen.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">✨ Zero-Typing Solution (Method 1 Below):</div>
                        <p>
                          Since you already placed your JSON credentials file into the project, you don&apos;t need to look up your Channel ID, Name, or Handle!
                          Just run the 1-click command below in PowerShell. It opens your browser, asks you to click &quot;Allow&quot;, and <strong>automatically detects your Channel ID, Name, and Handle</strong> and saves everything to Supabase.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Method 1: 1-Click Desktop OAuth Runner */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-red-200 dark:border-red-900/40 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-red-700 dark:text-red-400">
                      <Youtube className="w-4 h-4 text-red-600" />
                      <span>Method 1: 1-Click Authenticator (Recommended)</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-500 font-semibold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Zero Typing
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Run this command in PowerShell. It opens your browser to select your YouTube channel, auto-detects all your channel details, and links it live:
                  </p>
                  
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs">
                    <span className="flex-1 truncate pl-1">python scratch/authorize_youtube.py</span>
                    <button
                      type="button"
                      onClick={handleCopyCommand}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-sans font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
                    >
                      {copiedCommand ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                      <span>{copiedCommand ? 'Copied!' : 'Copy Command'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                      <span className="font-bold text-slate-700 dark:text-slate-200 block">1. Run Command</span>
                      <span>Paste in terminal</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                      <span className="font-bold text-slate-700 dark:text-slate-200 block">2. Browser Opens</span>
                      <span>Click &quot;Allow&quot;</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                      <span className="font-bold text-slate-700 dark:text-slate-200 block">3. Auto Connected</span>
                      <span>Channel appears here</span>
                    </div>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-[11px] font-mono uppercase text-slate-400">
                    Or manual token entry
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                {/* Method 2: Manual YouTube Token */}
                <form onSubmit={handleConnectYouTube} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      YouTube Channel ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
                      value={ytChannelId}
                      onChange={(e) => setYtChannelId(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Found in YouTube Studio &gt; Settings &gt; Channel &gt; Advanced settings &gt; Channel ID.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Channel Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Tech Cheat Codes"
                        value={ytChannelTitle}
                        onChange={(e) => setYtChannelTitle(e.target.value)}
                        className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Custom Handle</label>
                      <input
                        type="text"
                        placeholder="e.g. techcheatcodes"
                        value={ytCustomUrl}
                        onChange={(e) => setYtCustomUrl(e.target.value)}
                        className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Google OAuth Refresh Token
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="1//0... (From Google OAuth Playground or authorization script)"
                      value={ytRefreshToken}
                      onChange={(e) => setYtRefreshToken(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Note: This is NOT the API key. It is generated via OAuth consent (use Method 1 above to avoid this).
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Daily Shorts Frequency</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ytFreq}
                        onChange={(e) => setYtFreq(e.target.value)}
                        className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Slots (PKT / HH:MM)</label>
                      <input
                        type="text"
                        value={ytTimes}
                        onChange={(e) => setYtTimes(e.target.value)}
                        className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsConnectModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isConnectingYt}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold shadow-md disabled:opacity-50"
                    >
                      {isConnectingYt && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isConnectingYt ? 'Connecting...' : 'Connect YouTube Channel'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ─── INSTAGRAM CONNECTION PANEL ─── */}
            {modalPlatform === 'instagram' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Expandable Instagram Guide Accordion */}
                <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setShowInstagramGuide(!showInstagramGuide)}
                    className="w-full p-3.5 flex items-center justify-between font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100/40 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span>How to get your Instagram Token (Step-by-Step)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      <span>{showInstagramGuide ? 'Hide Guide' : 'Show Guide'}</span>
                      {showInstagramGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                  {showInstagramGuide && (
                    <div className="p-4 pt-1 space-y-2 text-[11px] text-slate-600 dark:text-slate-300 border-t border-purple-100 dark:border-purple-900/30 leading-relaxed">
                      <ol className="list-decimal list-inside space-y-1.5">
                        <li>
                          Open{' '}
                          <a
                            href="https://developers.facebook.com/tools/explorer/"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 dark:text-blue-400 underline font-semibold"
                          >
                            Meta Graph API Explorer
                          </a>
                          .
                        </li>
                        <li>Select your Meta App from the top right dropdown.</li>
                        <li>Under &quot;User or Page&quot;, select <strong>User Token</strong>.</li>
                        <li>
                          Add permissions:
                          <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold"> instagram_basic</span>,
                          <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold"> instagram_content_publish</span>, and
                          <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold"> pages_show_list</span>.
                        </li>
                        <li>Click <strong>Generate Access Token</strong> and approve permissions.</li>
                        <li>
                          Paste token below. The engine will <strong>automatically detect</strong> your username, platform account ID, and profile!
                        </li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* Option A: 1-Click Meta OAuth */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Method 1: Direct Meta OAuth</span>
                    <span className="text-[10px] font-mono text-emerald-500 font-semibold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Authorize directly via Instagram / Meta. You will be redirected to approve permissions, then returned
                    here automatically.
                  </p>
                  <a
                    href="/api/auth/instagram"
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    <span>Authorize with Meta</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-[11px] font-mono uppercase text-slate-400">Or connect with token</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                {/* Option B: Manual User Token Connection */}
                <form onSubmit={handleConnectToken} className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Instagram User Access Token
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Paste Instagram User Access Token (EAAB... / IGAA...)"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Account Display Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. LifeFuel Second Channel"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Daily Posting Frequency</label>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={freqInput}
                        onChange={(e) => setFreqInput(e.target.value)}
                        className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Slots (PKT / HH:MM)</label>
                      <input
                        type="text"
                        value={timesInput}
                        onChange={(e) => setTimesInput(e.target.value)}
                        className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsConnectModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isValidating}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md disabled:opacity-50"
                    >
                      {isValidating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isValidating ? 'Verifying with Meta...' : 'Validate & Connect'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Configuration Modal */}
      {isConfigModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsConfigModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Configure Schedule: @{selectedAccount.handle}
            </h3>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Daily Posting Frequency (Reels / Day)
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={editFreq}
                  onChange={(e) => {
                    const f = parseInt(e.target.value, 10) || 1;
                    setEditFreq(f);
                    // Dynamically calculate default slots for this frequency
                    if (f === 1) setEditTimes('20:00');
                    else if (f === 2) setEditTimes('13:00, 20:00');
                    else if (f === 3) setEditTimes('09:00, 15:00, 20:00');
                    else if (f === 4) setEditTimes('09:00, 13:00, 17:00, 21:00');
                    else if (f === 5) setEditTimes('09:00, 12:00, 15:00, 18:00, 21:00');
                  }}
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Daily Posting Slots in PKT (Asia/Karachi)
                </label>
                <input
                  type="text"
                  value={editTimes}
                  onChange={(e) => setEditTimes(e.target.value)}
                  placeholder="09:00, 13:00, 17:00, 21:00"
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Default Caption Template</label>
                <textarea
                  rows={3}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md disabled:opacity-50"
                >
                  {isSavingConfig ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Folder Swapping Modal */}
      {isFolderModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsFolderModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <FolderSync className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Swap Source Folder
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target account: <span className="font-semibold text-purple-600 dark:text-purple-400">@{selectedAccount.handle}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Service Account Share Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Google Drive Permission Required</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Before validating, share your Google Drive folder as <strong className="text-slate-700 dark:text-slate-300">Viewer</strong> with the Engine&apos;s service account:
              </p>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-blue-600 dark:text-blue-400 break-all select-all">
                reels-drive-reader@theta-dialect-504423-f6.iam.gserviceaccount.com
              </div>
            </div>

            {/* Folder Input & Validation */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Google Drive Folder URL or Folder ID
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={folderInput}
                    onChange={(e) => setFolderInput(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/1VC5hQbbCs... or ID"
                    className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleValidateFolder}
                    disabled={isValidatingFolder || !folderInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shrink-0"
                  >
                    {isValidatingFolder ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isValidatingFolder ? 'Checking...' : 'Validate'}</span>
                  </button>
                </div>
              </div>

              {/* Validation Result Box */}
              {folderValidationResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs ${
                    folderValidationResult.valid || folderValidationResult.success
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {folderValidationResult.valid || folderValidationResult.success ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ready to Ingest: &quot;{folderValidationResult.folderName}&quot;</span>
                      </div>
                      <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90">
                        Detected <strong className="font-semibold">{folderValidationResult.videoCount} MP4 videos</strong> in folder. Safe ingestion verified.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Folder Inaccessible</span>
                      </div>
                      <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90">
                        {folderValidationResult.error || 'Check that folder is shared with the service account.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Rollback Option if Previous Folder Exists */}
              {selectedAccount.previous_drive_folder_id && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Previous Source:</span>
                    <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      {selectedAccount.previous_drive_folder_id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRollbackFolder(selectedAccount.previous_drive_folder_id!)}
                    disabled={isSavingFolder}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Rollback</span>
                  </button>
                </div>
              )}

              {/* Auto Verify Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={autoVerifyOnSwap}
                    onChange={(e) => setAutoVerifyOnSwap(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 shrink-0 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-purple-900 dark:text-purple-300">
                      Verify connection: Post 1 sample Reel now
                    </span>
                    <p className="text-[11px] text-purple-700/80 dark:text-purple-400/80 mt-0.5">
                      Immediately publishes 1 video from the folder live to Instagram to confirm attachment and publishing.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDriveFolder}
                disabled={isSavingFolder || !(folderValidationResult?.valid || folderValidationResult?.success)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
              >
                {isSavingFolder && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSavingFolder ? 'Activating Source...' : 'Activate Source Folder'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
