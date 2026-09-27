'use client';

import React, { useState } from 'react';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '@/lib/themeContext';
import { Experiment } from '@/app/api/experiments/route';

interface ExperimentLabProps {
  experiments: Experiment[];
  isExperimentMode: boolean;
  onRefresh: () => void;
  publishedPosts: any[];
}

export function ExperimentLab({
  experiments,
  isExperimentMode,
  onRefresh,
  publishedPosts = [],
}: ExperimentLabProps) {
  const { addToast } = useApp();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [newExpName, setNewExpName] = useState('');
  const [newExpObjective, setNewExpObjective] = useState('');
  const [newExpVariants, setNewExpVariants] = useState('09:00 PKT (Baseline), 13:00 PKT, 17:00 PKT, 21:00 PKT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeExperiment = experiments.find((e) => e.status === 'active') || experiments[0];
  const publishedCount = publishedPosts.length;

  const handleToggleMode = async () => {
    try {
      const next = !isExperimentMode;
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_mode', isExperimentMode: next }),
      });
      if (!res.ok) throw new Error('Failed to toggle experiment mode');
      addToast(
        next ? 'warning' : 'info',
        next ? 'Experiment Mode Activated' : 'Experiment Mode Deactivated',
        next
          ? 'Scheduler will systematically vary posting times to gather statistical evidence.'
          : 'Scheduler restored to standard fixed slots.'
      );
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Toggle Failed', err.message);
    }
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim()) {
      addToast('warning', 'Missing Name', 'Please provide an experiment name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const variantsList = newExpVariants.split(',').map((v) => v.trim()).filter(Boolean);

      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          experiment: {
            name: newExpName,
            objective: newExpObjective,
            variable_tested: 'posting_time',
            control_baseline: variantsList[0] || '09:00 PKT (Baseline)',
            variants: variantsList,
            metrics_to_evaluate: ['views', 'reach', 'likes', 'comments', 'saved'],
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            posts_per_day: 4,
            sample_size_target: 30,
            status: 'active',
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to create experiment');

      addToast('success', 'Experiment Launched', `Registered test "${newExpName}"`);
      setIsBuilderOpen(false);
      setNewExpName('');
      setNewExpObjective('');
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute real sample count & metrics per variant from actual published posts
  const computeVariantMetrics = (variantStr: string) => {
    // Extract hour e.g. "09" from "09:00 PKT (Baseline)"
    const match = variantStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return { count: 0, avgViews: 0, status: 'Accumulating' };

    const targetHour = parseInt(match[1], 10);

    const matchingPosts = publishedPosts.filter((p) => {
      const dtStr = p.scheduled_at || p.published_at;
      if (!dtStr) return false;
      const d = new Date(dtStr);
      // Format in Asia/Karachi
      const pktHour = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Karachi',
          hour: '2-digit',
          hour12: false,
        }).format(d),
        10
      );
      return Math.abs(pktHour - targetHour) <= 1; // allow +/- 1 hour margin
    });

    const count = matchingPosts.length;
    let totalViews = 0;
    for (const p of matchingPosts) {
      totalViews += p.liveMetrics?.views || 0;
    }
    const avgViews = count > 0 ? Math.round(totalViews / count) : 0;
    const status = count >= 30 ? 'Statistical Power Achieved' : `Accumulating (${count}/30)`;

    return { count, avgViews, status };
  };

  return (
    <div className="space-y-6">
      {/* Research Engine Philosophy Banner */}
      <div className="p-6 rounded-[28px] bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-blue-950/40 border border-purple-800/40 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FlaskConical className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
              Dual Engine Architecture
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Posting Engine + Research Engine</h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            The IG Engine doesn't just publish on a fixed schedule. It can deliberately explore posting dimensions
            (time, structure, frequency) to gather real empirical evidence over time.
          </p>
        </div>

        {/* Experiment Mode Toggle */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
          <div>
            <div className="text-xs font-semibold text-white">Experiment Mode</div>
            <div className="text-[11px] text-slate-400">Varies publication slots dynamically</div>
          </div>

          <button
            onClick={handleToggleMode}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              isExperimentMode
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isExperimentMode ? 'Mode Active' : 'Enable Mode'}
          </button>
        </div>
      </div>

      {/* Active Experiment Deep Dive */}
      {activeExperiment && (
        <div className="p-6 rounded-[28px] bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 text-xs font-mono font-semibold">
                  Status: {activeExperiment.status.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {activeExperiment.id}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {activeExperiment.name}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBuilderOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Experiment</span>
              </button>
            </div>
          </div>

          {/* Objective */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-900 dark:text-white mr-1.5">Hypothesis & Objective:</span>
            {activeExperiment.objective}
          </div>

          {/* Test Variants Table with REAL Measured Data */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Testing Variants & Real Measured Data
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeExperiment.variants.map((variant, idx) => {
                const isBaseline = idx === 0;
                const metrics = computeVariantMetrics(variant);

                return (
                  <div
                    key={variant}
                    className={`p-4 rounded-2xl border transition-all ${
                      isBaseline
                        ? 'bg-blue-50/30 dark:bg-blue-950/15 border-blue-500/30'
                        : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-900 dark:text-white">{variant}</span>
                      {isBaseline && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
                          Baseline
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Sample Size:</span>
                        <span className="font-mono text-slate-900 dark:text-white font-medium">
                          N = {metrics.count} Reels
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Avg Plays:</span>
                        <span className="font-mono text-slate-900 dark:text-white font-medium">
                          {metrics.avgViews > 0 ? `${metrics.avgViews} views` : 'Pending'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 pt-1">
                        <span>Status:</span>
                        <span className="font-mono text-xs font-medium text-purple-600 dark:text-purple-400">
                          {metrics.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistical Uncertainty & Integrity Notice (Prompt Mandate!) */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <span className="font-bold">Statistical Rigor Notice:</span>
              <p>
                Sample size currently at N = {publishedCount} total published posts. Empirical research requires transparent sample
                sizes. The engine will not claim any time slot is "best" until sufficient sample density (target: 30
                posts per variant) is reached. Correlation does not equal causation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Experiment Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsBuilderOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Design New Experiment</h3>
            <form onSubmit={handleCreateExperiment} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Experiment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon vs Evening Post Slots (PKT)"
                  value={newExpName}
                  onChange={(e) => setNewExpName(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Hypothesis / Objective</label>
                <textarea
                  rows={3}
                  required
                  placeholder="What empirical question are you answering?"
                  value={newExpObjective}
                  onChange={(e) => setNewExpObjective(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Variants (comma-separated PKT times or values)
                </label>
                <input
                  type="text"
                  required
                  value={newExpVariants}
                  onChange={(e) => setNewExpVariants(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md"
                >
                  {isSubmitting ? 'Saving...' : 'Deploy Experiment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
