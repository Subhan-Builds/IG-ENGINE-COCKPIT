'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/themeContext';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import { MobileNav } from '@/components/Layout/MobileNav';

// View Components
import { MetricCards } from '@/components/Overview/MetricCards';
import { CapsuleSliderChart } from '@/components/Overview/CapsuleSliderChart';
import { QuickResourceSidebar } from '@/components/Overview/QuickResourceSidebar';
import { GitHubWorkerUsage } from '@/components/Overview/GitHubWorkerUsage';
import { ActivityStream } from '@/components/Overview/ActivityStream';
import { AttentionBanner } from '@/components/Overview/AttentionBanner';

import { AccountsView, AccountItem } from '@/components/Accounts/AccountsView';
import { ContentView } from '@/components/Content/ContentView';
import { QueueTable } from '@/components/Queue/QueueTable';
import { CalendarView } from '@/components/Calendar/CalendarView';
import { PublishedGrid } from '@/components/Posts/PublishedGrid';
import { AnalyticsOverview } from '@/components/Analytics/AnalyticsOverview';
import { ExperimentLab } from '@/components/Experiments/ExperimentLab';
import { HealthOverview } from '@/components/Health/HealthOverview';
import { SettingsView } from '@/components/Settings/SettingsView';
import { VideoModal } from '@/components/Queue/VideoModal';

import { Loader2 } from 'lucide-react';
import { formatDateTimePKT } from '@/lib/utils';

export default function DashboardPage() {
  const { activeTab, setActiveTab, selectedAccountId, addToast } = useApp();

  // State
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [healthData, setHealthData] = useState<any>(null);
  const [workerData, setWorkerData] = useState<any>(null);
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);
  const [experimentsData, setExperimentsData] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all live data
  const fetchData = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setIsRefreshing(true);
      try {
        const [accRes, vidsRes, setRes, healthRes, workerRes, mediaRes, expRes] = await Promise.all([
          fetch('/api/accounts', { cache: 'no-store' }),
          fetch('/api/videos', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/health', { cache: 'no-store' }),
          fetch('/api/worker/runs', { cache: 'no-store' }),
          fetch('/api/instagram/media', { cache: 'no-store' }),
          fetch('/api/experiments', { cache: 'no-store' }),
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
        if (expRes.ok) {
          const e = await expRes.json();
          setExperimentsData(e);
        }
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        addToast('error', 'Sync Warning', 'Could not refresh some live metrics from backend.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addToast]
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
  const filteredVideos = videos.filter((v) => {
    if (selectedAccountId === 'all') return true;
    const vidAcc = v.account_id || 'acc_lifefuel_01';
    return vidAcc === selectedAccountId;
  });

  const filteredPosts = publishedPosts.filter((p) => {
    if (selectedAccountId === 'all') return true;
    const vidAcc = p.account_id || 'acc_lifefuel_01';
    return vidAcc === selectedAccountId;
  });

  // Derived Values
  const scheduledVideos = filteredVideos.filter((v) => v.status === 'scheduled');
  const publishedVideos = filteredVideos.filter((v) => v.status === 'published');
  const bufferVideos = filteredVideos.filter((v) => v.status === 'hf_ready' || v.status === 'scheduled');
  const failedVideos = filteredVideos.filter((v) => v.status === 'publish_failed' || v.status === 'import_failed');

  // Next up video
  const nextUpVideo =
    scheduledVideos.length > 0
      ? [...scheduledVideos].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )[0]
      : null;

  const postingEnabled = settings.posting_enabled !== 'false';
  const postingTimes = settings.posting_times || '09:00, 13:00, 17:00, 21:00';
  const bufferTarget = parseInt(settings.hf_buffer_target || '15', 10);
  const quotaUsage = healthData?.subsystems?.instagram?.quota?.quota_usage ?? 3;
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

  // Immediate Publish Trigger
  const handleTriggerImmediatePublish = async () => {
    try {
      const res = await fetch('/api/videos/publish-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addToast(
        'success',
        'Publisher Dispatched',
        data.video_id
          ? 'Next Reel queued for immediate publication and GitHub Actions runner launched.'
          : 'Dispatched Publisher workflow on GitHub Actions.'
      );
      setTimeout(() => fetchData(true), 4000);
    } catch (err: any) {
      addToast('error', 'Publish Failed', err.message);
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
    // Outer sage/neutral background framing the floating canvas (matching Ref-for-dashboard-ui-ux.png)
    <div className="min-h-screen bg-[#e2e8e4] dark:bg-[#070b10] text-slate-900 dark:text-slate-100 p-2 sm:p-4 lg:p-6 antialiased selection:bg-[#e3fb45] selection:text-black">
      {/* Floating Canvas Container */}
      <div className="flex bg-[#f9fafb] dark:bg-[#0c1017] rounded-[36px] shadow-2xl border border-slate-300/80 dark:border-slate-800 min-h-[calc(100vh-32px)] sm:min-h-[calc(100vh-48px)] overflow-hidden">
        {/* Desktop Left Dock */}
        <Sidebar
          queueCount={scheduledVideos.length}
          attentionCount={healthData?.attentionItems?.length || 0}
          publishedCount={filteredPosts.length}
          accountsCount={accounts.length}
          hasActiveExperiment={experimentsData?.isExperimentMode}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onRefresh={() => fetchData(true)}
            isRefreshing={isRefreshing}
            postingEnabled={postingEnabled}
            onTogglePosting={handleTogglePosting}
            nextPostTime={nextUpVideo?.scheduled_at ? formatDateTimePKT(nextUpVideo.scheduled_at) : null}
            overallHealth={overallHealth}
            accounts={accounts}
            onOpenAddAccount={() => setActiveTab('accounts')}
          />

          <main className="flex-1 px-6 pb-8 pt-2 max-w-7xl w-full mx-auto space-y-6">
            {/* TAB 1: COMMAND CENTER (OVERVIEW - Exactly matching UI reference) */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                {healthData?.attentionItems?.length > 0 && (
                  <AttentionBanner items={healthData.attentionItems} onAction={handleAttentionAction} />
                )}

                {/* Top Highlight Cards */}
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

                {/* Middle Row: Capsule Slider Chart + Quick Resource Cards (matching reference) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <CapsuleSliderChart posts={filteredPosts} />
                  </div>
                  <div>
                    <QuickResourceSidebar />
                  </div>
                </div>

                {/* Bottom Row: Runner & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GitHubWorkerUsage usage={workerData?.github} />
                  <ActivityStream runs={workerData?.dbRuns || []} />
                </div>
              </div>
            )}

            {/* TAB 2: ACCOUNTS MANAGEMENT (Stage E & F) */}
            {activeTab === 'accounts' && (
              <div className="animate-fadeIn">
                <AccountsView accounts={accounts} onRefresh={() => fetchData(true)} />
              </div>
            )}

            {/* TAB 3: CONTENT MANAGEMENT (Section 14) */}
            {activeTab === 'content' && (
              <div className="animate-fadeIn">
                <ContentView
                  videos={filteredVideos}
                  onSelectVideo={(v) => setSelectedVideo(v)}
                  onRefresh={() => fetchData(true)}
                />
              </div>
            )}

            {/* TAB 4: QUEUE & VIDEO MANAGEMENT */}
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

            {/* TAB 7: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="animate-fadeIn">
                <AnalyticsOverview posts={filteredPosts} />
              </div>
            )}

            {/* TAB 8: EXPERIMENTS */}
            {activeTab === 'experiments' && (
              <div className="animate-fadeIn">
                <ExperimentLab
                  experiments={experimentsData?.experiments || []}
                  isExperimentMode={experimentsData?.isExperimentMode || false}
                  onRefresh={() => fetchData(true)}
                  publishedPosts={filteredPosts}
                />
              </div>
            )}

            {/* TAB 9: HEALTH MONITOR */}
            {activeTab === 'health' && (
              <div className="animate-fadeIn">
                <HealthOverview
                  healthData={healthData}
                  onRefresh={() => fetchData(true)}
                  onAction={handleAttentionAction}
                />
              </div>
            )}

            {/* TAB 10: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="animate-fadeIn">
                <SettingsView
                  settings={settings}
                  onRefresh={() => fetchData(true)}
                  onSaveSettings={handleSaveSettings}
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
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onUpdated={() => fetchData(true)}
        />
      )}
    </div>
  );
}
