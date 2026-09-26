'use client';

import React, { useState } from 'react';
import { X, Save, Clock, RefreshCw, Send, EyeOff, Film, AlertTriangle, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/UI/Badge';
import { SlotPicker } from './SlotPicker';
import { formatBytes, formatDateTime } from '@/lib/utils';
import { useApp } from '@/lib/themeContext';

interface VideoModalProps {
  video: any | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function VideoModal({ video, isOpen, onClose, onUpdated }: VideoModalProps) {
  const { addToast } = useApp();
  const [caption, setCaption] = useState<string>(video?.caption || '');
  const [scheduledAt, setScheduledAt] = useState<string | null>(video?.scheduled_at || null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (video) {
      setCaption(video.caption || '');
      setScheduledAt(video.scheduled_at || null);
    }
  }, [video]);

  if (!isOpen || !video) return null;

  const charCount = caption.length;
  const hashtags = (caption.match(/#[a-zA-Z0-9_]+/g) || []).length;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: video.id,
          caption,
          scheduled_at: scheduledAt,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update video');
      }

      addToast('success', 'Changes Saved', `Updated settings for ${video.drive_filename}`);
      onUpdated();
      onClose();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string, label: string) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: video.id,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error('Status update failed');

      addToast('success', 'Status Updated', `Video marked as ${label}`);
      onUpdated();
      onClose();
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/videos/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: video.id }),
      });

      if (!res.ok) throw new Error('Retry failed');

      addToast('success', 'Retry Queued', `${video.drive_filename} reset for processing`);
      onUpdated();
      onClose();
    } catch (err: any) {
      addToast('error', 'Retry Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isFailed = video.status === 'publish_failed' || video.status === 'import_failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Modal Window */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-md">
                {video.drive_filename}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                <span>Size: {formatBytes(video.drive_size_bytes)}</span>
                <span>•</span>
                <span>Discovered: {formatDateTime(video.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={video.status} />
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Video Preview Player */}
          <div className="space-y-4">
            <div className="w-full aspect-[9/16] max-h-96 rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-inner relative flex items-center justify-center">
              {video.hf_url ? (
                <video
                  src={video.hf_url}
                  controls
                  preload="metadata"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-500 text-xs">
                  <Film className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <span>Video file is waiting in Google Drive (not yet buffered to Hugging Face).</span>
                </div>
              )}
            </div>

            {/* Error details if failed */}
            {video.last_error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Last Failure Log:</span>
                </div>
                <p className="font-mono text-[11px] leading-relaxed break-words">{video.last_error}</p>
              </div>
            )}

            {/* Instagram link if published */}
            {video.instagram_media_id && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center justify-between">
                <span>Instagram Media ID: {video.instagram_media_id}</span>
                <a
                  href={`https://www.instagram.com/reel/${video.instagram_media_id}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-semibold hover:underline"
                >
                  <span>View Post</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Controls & Editing */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Caption Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                  <label className="font-semibold">Reel Caption</label>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span>{charCount} / 2200 chars</span>
                    <span>•</span>
                    <span>{hashtags} hashtags</span>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Enter custom caption for this Reel, or leave blank to use the global motivation template..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Reschedule Slot Picker */}
              <SlotPicker
                initialUtcIso={scheduledAt}
                onChange={(utcIso) => setScheduledAt(utcIso)}
              />
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  {isFailed ? (
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-semibold transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Processing</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStatusChange('skipped', 'Skipped')}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium transition-all"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Skip Video</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
