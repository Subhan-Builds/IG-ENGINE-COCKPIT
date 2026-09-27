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
    if (account.is_default) {
      addToast('warning', 'Default Account', 'Account #1 is primary and cannot be disconnected.');
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

  return (
    <div className="space-y-6">
      {/* Top Banner / Philosophy */}
      <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Multi-Account Architecture
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Connected Platform Accounts</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
            One centralized engine driving autonomous content distribution across independent Instagram accounts,
            each with its own schedule and quota runway.
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

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc, idx) => {
          const quota = acc.quota || { quota_total: 100, quota_usage: 0, remaining: 100 };
          const quotaPercent = Math.min(100, Math.round((quota.quota_usage / quota.quota_total) * 100));

          return (
            <div
              key={acc.id}
              className={`p-6 rounded-[28px] border transition-all ${
                acc.is_default
                  ? 'bg-white dark:bg-[#111726] border-blue-500/40 shadow-sm relative overflow-hidden'
                  : 'bg-white dark:bg-[#111726] border-slate-200/80 dark:border-slate-800/80 shadow-sm'
              }`}
            >
              {acc.is_default && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[10px] font-mono font-bold rounded-bl-xl uppercase tracking-wider">
                  Account #1 • Primary
                </div>
              )}

              {/* Account Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white text-base font-bold shadow-md shadow-rose-500/20">
                    {acc.handle.slice(0, 2).toUpperCase()}
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
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {acc.account_type || 'MEDIA_CREATOR'}
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

                  {!acc.is_default && (
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
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connect Instagram Account</h3>
                <p className="text-xs text-slate-400">Add Account #2 to the IG Engine Ecosystem</p>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
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
    </div>
  );
}
