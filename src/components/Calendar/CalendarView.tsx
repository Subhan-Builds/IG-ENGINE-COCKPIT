'use client';

import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Settings, Film, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { PostingSlotsDrawer } from './PostingSlotsDrawer';
import { VideoModal } from '@/components/Queue/VideoModal';
import { formatTimeUTC } from '@/lib/utils';

interface CalendarViewProps {
  videos: any[];
  postingTimesStr: string;
  onRefresh: () => void;
  onSavePostingTimes: (newTimes: string) => Promise<void>;
}

export function CalendarView({
  videos,
  postingTimesStr,
  onRefresh,
  onSavePostingTimes,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSlotsDrawerOpen, setIsSlotsDrawerOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* Posting Slots Summary & Drawer Trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Daily Slots:</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 font-semibold">
              {postingTimesStr} PKT
            </span>
          </div>

          <button
            onClick={() => setIsSlotsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Daily Slots</span>
          </button>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111726] shadow-sm overflow-hidden p-4">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-2 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800/60 text-center font-mono text-[11px] font-semibold text-slate-400 uppercase">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const dayVideos = videos.filter((v) => {
              const target = v.scheduled_at || v.published_at;
              return target ? isSameDay(new Date(target), day) : false;
            });

            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[110px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrentDay
                    ? 'border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/10'
                    : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/30'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isCurrentDay
                        ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayVideos.length > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500">
                      {dayVideos.length}
                    </span>
                  )}
                </div>

                {/* Day Items */}
                <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-20 scrollbar-none">
                  {dayVideos.map((v) => {
                    const isPublished = v.status === 'published';
                    const isFailed = v.status === 'publish_failed' || v.status === 'import_failed';

                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVideo(v)}
                        className={`w-full text-left p-1.5 rounded-lg border text-[10px] leading-tight truncate transition-all flex items-center gap-1 ${
                          isPublished
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : isFailed
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        }`}
                        title={v.drive_filename}
                      >
                        {isPublished ? (
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                        ) : isFailed ? (
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                        ) : (
                          <Clock className="w-3 h-3 shrink-0" />
                        )}
                        <span className="font-mono font-medium shrink-0">
                          {formatTimeUTC(v.scheduled_at || v.published_at)}
                        </span>
                        <span className="truncate">{v.drive_filename}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Posting Slots Drawer */}
      <PostingSlotsDrawer
        isOpen={isSlotsDrawerOpen}
        onClose={() => setIsSlotsDrawerOpen(false)}
        postingTimesStr={postingTimesStr}
        onSave={onSavePostingTimes}
      />

      {/* Video Detail Modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onUpdated={onRefresh}
        />
      )}
    </div>
  );
}
