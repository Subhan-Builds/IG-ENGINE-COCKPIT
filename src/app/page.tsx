'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/themeContext';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import { MobileNav } from '@/components/Layout/MobileNav';

// View Components
import { MetricCards } from '@/components/Overview/MetricCards';
import { NextUpHero } from '@/components/Overview/NextUpHero';
import { QuickActions } from '@/components/Overview/QuickActions';
import { GitHubWorkerUsage } from '@/components/Overview/GitHubWorkerUsage';
import { ActivityStream } from '@/components/Overview/ActivityStream';
import { AttentionBanner } from '@/components/Overview/AttentionBanner';
import { QueueTable } from '@/components/Queue/QueueTable';
import { CalendarView } from '@/components/Calendar/CalendarView';
import { PublishedGrid } from '@/components/Posts/PublishedGrid';
import { AnalyticsOverview } from '@/components/Analytics/AnalyticsOverview';
import { ExperimentLab } from '@/components/Experiments/ExperimentLab';
import { HealthOverview } from '@/components/Health/HealthOverview';
import { SettingsView } from '@/components/Settings/SettingsView';
import { VideoModal } from '@/components/Queue/VideoModal';

import { Loader2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function DashboardPage() {
  const { activeTab, setActiveTab, addToast } = useApp();

  // State
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
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const [vidsRes, setRes, healthRes, workerRes, mediaRes, expRes] = await Promise.all([
        fetch('/api/videos', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' }),
        fetch('/api/health', { cache: 'no-store' }),
        fetch('/api/worker/runs', { cache: 'no-store' }),
        fetch('/api/instagram/media', { cache: 'no-store' }),
        fetch('/api/experiments', { cache: 'no-store' }),
      ]);

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
  }, [addToast]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 45s for live observability
    const interval = setInterval(() => fetchData(false), 45000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Derived Values
  const scheduledVideos = videos.filter((v) => v.status === 'scheduled');
  const publishedVideos = videos.filter((v) => v.status === 'published');
  const bufferVideos = videos.filter((v) => v.status === 'hf_ready' || v.status === 'scheduled');
  const failedVideos = videos.filter((v) => v.status === 'publish_failed' || v.status === 'import_failed');

  // Next up video: oldest scheduled video whose time is coming or due
  const nextUpVideo = scheduledVideos.length > 0
    ? [...scheduledVideos].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
    : null;

  const postingEnabled = settings.posting_enabled !== 'false';
  const postingTimes = settings.posting_times || '09:00,15:00,20:00';
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
      const res = await fetch('/api/worker/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: 'publisher' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addToast('success', 'Publisher Triggered', 'Dispatched Publisher workflow on GitHub Actions.');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-mono tracking-wider uppercase text-slate-400">Loading IG Engine Cockpit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50/50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white pb-20 lg:pb-0">
      {/* Desktop Sidebar Navigation */}
      <Sidebar
        queueCount={scheduledVideos.length}
        attentionCount={healthData?.attentionItems?.length || 0}
        publishedCount={publishedPosts.length}
        hasActiveExperiment={experimentsData?.isExperimentMode}
      />

      {/* Main Content Surface */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onRefresh={() => fetchData(true)}
          isRefreshing={isRefreshing}
          postingEnabled={postingEnabled}
          onTogglePosting={handleTogglePosting}
          nextPostTime={nextUpVideo?.scheduled_at ? formatDateTime(nextUpVideo.scheduled_at) : null}
          overallHealth={overallHealth}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: COMMAND CENTER (OVERVIEW) */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {healthData?.attentionItems?.length > 0 && (
                <AttentionBanner items={healthData.attentionItems} onAction={handleAttentionAction} />
              )}

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
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <NextUpHero
                    video={nextUpVideo}
                    onTriggerPublish={handleTriggerImmediatePublish}
                    onEdit={(v) => setSelectedVideo(v)}
                  />
                </div>
                <div>
                  <QuickActions
                    postingEnabled={postingEnabled}
                    onTogglePosting={handleTogglePosting}
                    failedCount={failedVideos.length}
                    onRefreshAll={() => fetchData(true)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GitHubWorkerUsage usage={workerData?.github} />
                <ActivityStream runs={workerData?.dbRuns || []} />
              </div>
            </div>
          )}

          {/* TAB 2: QUEUE & VIDEO MANAGEMENT */}
          {activeTab === 'queue' && (
            <div className="animate-fadeIn">
              <QueueTable videos={videos} onRefresh={() => fetchData(true)} />
            </div>
          )}

          {/* TAB 3: CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="animate-fadeIn">
              <CalendarView
                videos={videos}
                postingTimesStr={postingTimes}
                onRefresh={() => fetchData(true)}
                onSavePostingTimes={handleSavePostingTimes}
              />
            </div>
          )}

          {/* TAB 4: PUBLISHED POSTS */}
          {activeTab === 'posts' && (
            <div className="animate-fadeIn">
              <PublishedGrid posts={publishedPosts} />
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="animate-fadeIn">
              <AnalyticsOverview posts={publishedPosts} />
            </div>
          )}

          {/* TAB 6: EXPERIMENTS */}
          {activeTab === 'experiments' && (
            <div className="animate-fadeIn">
              <ExperimentLab
                experiments={experimentsData?.experiments || []}
                isExperimentMode={experimentsData?.isExperimentMode || false}
                onRefresh={() => fetchData(true)}
                publishedCount={publishedPosts.length}
              />
            </div>
          )}

          {/* TAB 7: HEALTH MONITOR */}
          {activeTab === 'health' && (
            <div className="animate-fadeIn">
              <HealthOverview
                healthData={healthData}
                onRefresh={() => fetchData(true)}
                onAction={handleAttentionAction}
              />
            </div>
          )}

          {/* TAB 8: SETTINGS */}
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
