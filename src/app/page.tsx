'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/themeContext';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import { MobileNav } from '@/components/Layout/MobileNav';

// View Components
import { NextUpHero } from '@/components/Overview/NextUpHero';
import { MetricCards } from '@/components/Overview/MetricCards';
import { GitHubWorkerUsage } from '@/components/Overview/GitHubWorkerUsage';
import { ActivityStream } from '@/components/Overview/ActivityStream';
import { AttentionBanner } from '@/components/Overview/AttentionBanner';

import { AccountsView, AccountItem } from '@/components/Accounts/AccountsView';
import { ContentView } from '@/components/Content/ContentView';
import { QueueTable } from '@/components/Queue/QueueTable';
import { CalendarView } from '@/components/Calendar/CalendarView';
import { PublishedGrid } from '@/components/Posts/PublishedGrid';
import { AnalyticsOverview } from '@/components/Analytics/AnalyticsOverview';
import { HealthOverview } from '@/components/Health/HealthOverview';
import { SettingsView } from '@/components/Settings/SettingsView';
import { VideoModal } from '@/components/Queue/VideoModal';

import { Loader2, ExternalLink, Clock, Layers, Film } from 'lucide-react';
import { formatDateTimePKT, formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { activeTab, setActiveTab, selectedAccountId, addToast } = useApp();

  // State
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [healthData, setHealthData] = useState<any>(null);
  const [workerData, setWorkerData] = useState<any>(null);
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch all live data (account-aware)
  const fetchData = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setIsRefreshing(true);
      try {
        const accountQuery =
          selectedAccountId && selectedAccountId !== 'all' ? `?account_id=${selectedAccountId}` : '';

        const [accRes, vidsRes, setRes, healthRes, workerRes, mediaRes] = await Promise.all([
          fetch('/api/accounts', { cache: 'no-store' }),
          fetch(`/api/videos${accountQuery}`, { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/health', { cache: 'no-store' }),
          fetch('/api/worker/runs', { cache: 'no-store' }),
          fetch(`/api/instagram/media${accountQuery}`, { cache: 'no-store' }),
        ]);

        if (accRes.ok) {
          const a = await accRes.json();
          setAccounts(a.accounts || []);
        }
        if (vidsRes.ok) {
          const v = await vidsRes.json();
          setVideos(v.videos || []);
        }
        if (setRes.ok) {
          const s = await setRes.json();
          setSettings(s.settings || {});
        }
        if (healthRes.ok) {
          const h = await healthRes.json();
          setHealthData(h);
        }
        if (workerRes.ok) {
          const w = await workerRes.json();
          setWorkerData(w);
        }
        if (mediaRes.ok) {
          const m = await mediaRes.json();
          setPublishedPosts(m.posts || []);
        }
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        addToast('error', 'Sync Warning', 'Could not refresh some live metrics from backend.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedAccountId, addToast]
  );

  useEffect(() => {
    fetchData();

    // Check URL parameters for OAuth redirect notices
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('connected') === 'success') {
        const handle = params.get('account') || 'Instagram Account';
        addToast('success', 'Account Linked Successfully!', `@${handle} is now connected to the engine.`);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('oauth_error')) {
        addToast('error', 'OAuth Connection Failed', params.get('oauth_error') || 'Meta authorization error.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Auto-refresh every 45s for live observability
    const interval = setInterval(() => fetchData(false), 45000);
    return () => clearInterval(interval);
  }, [fetchData, addToast]);

  // Account-filtered dataset
  const validAccountIds = new Set(accounts.map((a) => a.id));
  const filteredVideos = videos.filter((v) => {
    const vidAcc = v.account_id || 'acc_lifefuel_01';
    if (!validAccountIds.has(vidAcc)) return false;
    if (selectedAccountId === 'all') return true;
    return vidAcc === selectedAccountId;
  });

  const filteredPosts = publishedPosts.filter((p) => {
    const postAcc = p.account_id || 'acc_lifefuel_01';
    if (!validAccountIds.has(postAcc)) return false;
    if (selectedAccountId === 'all') return true;
    return postAcc === selectedAccountId;
  });

  // Active account metadata
  const currentAccount =
    accounts.find((a) => a.id === selectedAccountId) ||
    accounts.find((a) => a.is_default) ||
    accounts[0] ||
    null;

  // Derived Values
  const scheduledVideos = filteredVideos.filter((v) => v.status === 'scheduled');
  const publishedVideos = filteredVideos.filter((v) => v.status === 'published');
  const bufferVideos = filteredVideos.filter((v) => v.status === 'hf_ready' || v.status === 'scheduled');
  const failedVideos = filteredVideos.filter((v) => v.status === 'publish_failed' || v.status === 'import_failed');

  // Next up video strictly for this account
  const nextUpVideo =
    scheduledVideos.length > 0
      ? [...scheduledVideos].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )[0]
      : null;

  const postingEnabled = settings.posting_enabled !== 'false';
  const postingTimes = currentAccount?.posting_times?.join(', ') || settings.posting_times || '09:00, 13:00, 17:00, 21:00';
  const bufferTarget = parseInt(settings.hf_buffer_target || '15', 10);
  const quotaUsage = currentAccount?.quota?.quota_usage ?? (healthData?.subsystems?.instagram?.quota?.quota_usage ?? 3);
  const overallHealth = healthData?.overallHealth || 'optimal';

  // Toggle Posting Handler
  const handleTogglePosting = async () => {
    try {
      const nextVal = !postingEnabled;
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'posting_enabled', value: String(nextVal) }),
      });
      if (!res.ok) throw new Error('Failed to update posting status');

      setSettings((prev) => ({ ...prev, posting_enabled: String(nextVal) }));
      addToast(
        nextVal ? 'success' : 'warning',
        nextVal ? 'Automation Resumed' : 'Automation Paused',
        nextVal ? 'The publisher worker will continue publishing on schedule.' : 'All automated Reel publishing is held.'
      );
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message);
    }
  };

  // Immediate Publish Trigger (Strictly targets the currently selected account!)
  const handleTriggerImmediatePublish = async () => {
    try {
      setIsPublishing(true);
      const targetId = selectedAccountId === 'all' ? currentAccount?.id : selectedAccountId;
      const res = await fetch('/api/videos/publish-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: targetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addToast(
        'success',
        data.published_direct ? 'Reel Live on Instagram!' : 'Publisher Dispatched',
        data.message || 'Reel published successfully.'
      );
      setTimeout(() => fetchData(true), 2500);
    } catch (err: any) {
      addToast('error', 'Publish Failed', err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Save posting times
  const handleSavePostingTimes = async (newTimes: string) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'posting_times', value: newTimes }),
    });
    if (!res.ok) throw new Error('Failed to save slots');
    setSettings((prev) => ({ ...prev, posting_times: newTimes }));
  };

  // Save generic settings
  const handleSaveSettings = async (map: Record<string, string>) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: map }),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    setSettings((prev) => ({ ...prev, ...map }));
  };

  // Action Router for Attention Banner
  const handleAttentionAction = (actionType: string) => {
    switch (actionType) {
      case 'trigger_importer':
        fetch('/api/worker/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow: 'importer' }),
        }).then(() => {
          addToast('success', 'Importer Dispatched', 'Importing new videos from Google Drive to Hugging Face.');
        });
        break;
      case 'retry_failed':
        fetch('/api/videos/retry', { method: 'POST' }).then(() => {
          addToast('success', 'Retry Initiated', 'Reset failed videos for retry.');
          fetchData(true);
        });
        break;
      case 'view_worker':
        setActiveTab('health');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e4eae6] dark:bg-[#070b10] text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-900 dark:text-white animate-spin" />
          <p className="text-xs font-mono tracking-wider uppercase text-slate-500">Loading IG Engine Cockpit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e2e8e4] dark:bg-[#070b10] text-slate-900 dark:text-slate-100 p-2 sm:p-4 lg:p-6 antialiased selection:bg-[#e3fb45] selection:text-black">
      {/* Floating Canvas Container */}
      <div className="flex bg-[#f9fafb] dark:bg-[#0c1017] rounded-[36px] shadow-2xl border border-slate-300/80 dark:border-slate-800 min-h-[calc(100vh-32px)] sm:min-h-[calc(100vh-48px)] overflow-hidden">
        {/* Desktop Left Dock */}
        <Sidebar
          queueCount={scheduledVideos.length}
          attentionCount={healthData?.attentionItems?.length || 0}
          publishedCount={filteredPosts.length}
          accountsCount={accounts.length}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onRefresh={() => fetchData(true)}
            isRefreshing={isRefreshing}
            accounts={accounts}
            onOpenAddAccount={() => setActiveTab('accounts')}
            onPublishNow={handleTriggerImmediatePublish}
            isPublishing={isPublishing}
          />

          <main className="flex-1 px-6 pb-8 pt-4 max-w-7xl w-full mx-auto space-y-6">
            {/* TAB 1: EXECUTIVE OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                {healthData?.attentionItems?.length > 0 && (
                  <AttentionBanner items={healthData.attentionItems} onAction={handleAttentionAction} />
                )}

                {/* Next Up Hero Card for Active Account */}
                <NextUpHero
                  video={nextUpVideo}
                  onTriggerPublish={handleTriggerImmediatePublish}
                  onEdit={(v) => setSelectedVideo(v)}
                />

                {/* Key Real Metrics Row */}
                <MetricCards
                  bufferCount={bufferVideos.length}
                  bufferTarget={bufferTarget}
                  quotaUsedToday={quotaUsage}
                  quotaLimit={100}
                  sourceDriveCount={healthData?.subsystems?.drive?.sourceVideosCount || 100}
                  scheduledCount={scheduledVideos.length}
                  publishedCount={publishedVideos.length}
                  failedCount={failedVideos.length}
                  overallHealth={overallHealth}
                  onPublishNow={handleTriggerImmediatePublish}
                />

                {/* Middle Row: Upcoming Queue Preview + Live Posts Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Next Scheduled Posts Table */}
                  <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            Next Scheduled Queue ({scheduledVideos.length})
                          </h3>
                        </div>
                        <button
                          onClick={() => setActiveTab('queue')}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Full Queue →
                        </button>
                      </div>

                      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {scheduledVideos.slice(0, 5).map((vid) => (
                          <div key={vid.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div className="truncate pr-3">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {vid.drive_filename}
                              </p>
                              <span className="text-[11px] font-mono text-slate-400">
                                {formatDateTimePKT(vid.scheduled_at)}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold shrink-0">
                              Scheduled
                            </span>
                          </div>
                        ))}
                        {scheduledVideos.length === 0 && (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No videos currently in scheduled queue for this account.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Latest Published Reels */}
                  <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-emerald-500" />
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            Latest Published Reels ({filteredPosts.length})
                          </h3>
                        </div>
                        <button
                          onClick={() => setActiveTab('posts')}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View All Posts →
                        </button>
                      </div>

                      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/60">
                        {filteredPosts.slice(0, 5).map((p) => {
                          const permalink =
                            p.liveMetrics?.permalink || `https://www.instagram.com/reel/${p.instagram_media_id}/`;
                          return (
                            <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                              <div className="truncate pr-3">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {p.drive_filename || 'Instagram Reel'}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                                  <span>{formatDateTimePKT(p.published_at || p.created_at)}</span>
                                  <span>•</span>
                                  <span>{p.liveMetrics?.views ?? 0} views</span>
                                  <span>•</span>
                                  <span>{p.liveMetrics?.like_count ?? 0} likes</span>
                                </div>
                              </div>
                              <a
                                href={permalink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 shrink-0"
                                title="Open on Instagram"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          );
                        })}
                        {filteredPosts.length === 0 && (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No published reels yet for this account.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Runner & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GitHubWorkerUsage usage={workerData?.github} />
                  <ActivityStream runs={workerData?.dbRuns || []} />
                </div>
              </div>
            )}

            {/* TAB 2: ACCOUNTS MANAGEMENT */}
            {activeTab === 'accounts' && (
              <div className="animate-fadeIn">
                <AccountsView accounts={accounts} onRefresh={() => fetchData(true)} />
              </div>
            )}

            {/* TAB 3: CONTENT MANAGEMENT */}
            {activeTab === 'content' && (
              <div className="animate-fadeIn">
                <ContentView
                  videos={filteredVideos}
                  onSelectVideo={(v) => setSelectedVideo(v)}
                  onRefresh={() => fetchData(true)}
                />
              </div>
            )}

            {/* TAB 4: QUEUE MANAGEMENT */}
            {activeTab === 'queue' && (
              <div className="animate-fadeIn">
                <QueueTable videos={filteredVideos} onRefresh={() => fetchData(true)} />
              </div>
            )}

            {/* TAB 5: CALENDAR */}
            {activeTab === 'calendar' && (
              <div className="animate-fadeIn">
                <CalendarView
                  videos={filteredVideos}
                  postingTimesStr={postingTimes}
                  onRefresh={() => fetchData(true)}
                  onSavePostingTimes={handleSavePostingTimes}
                />
              </div>
            )}

            {/* TAB 6: PUBLISHED POSTS */}
            {activeTab === 'posts' && (
              <div className="animate-fadeIn">
                <PublishedGrid posts={filteredPosts} />
              </div>
            )}

            {/* TAB 7: LIVE ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="animate-fadeIn">
                <AnalyticsOverview posts={filteredPosts} />
              </div>
            )}

            {/* TAB 8: HEALTH MONITOR */}
            {activeTab === 'health' && (
              <div className="animate-fadeIn">
                <HealthOverview
                  healthData={healthData}
                  onRefresh={() => fetchData(true)}
                  onAction={handleAttentionAction}
                />
              </div>
            )}

            {/* TAB 9: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="animate-fadeIn">
                <SettingsView
                  settings={settings}
                  accounts={accounts}
                  onRefresh={() => fetchData(true)}
                  onSaveSettings={handleSaveSettings}
                  initialTab="accounts"
                />
              </div>
            )}

            {/* TAB 10: ABOUT & SYSTEM ROADMAP */}
            {activeTab === 'about' && (
              <div className="animate-fadeIn">
                <SettingsView
                  settings={settings}
                  accounts={accounts}
                  onRefresh={() => fetchData(true)}
                  onSaveSettings={handleSaveSettings}
                  initialTab="about"
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav />

      {/* Modal for editing selected video */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          isOpen={Boolean(selectedVideo)}
          onClose={() => setSelectedVideo(null)}
          onSave={() => {
            setSelectedVideo(null);
            fetchData(true);
          }}
        />
      )}
    </div>
  );
}
