'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, ArrowRight, RefreshCw, Play } from 'lucide-react';

interface AttentionItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  actionText?: string;
  actionType?: string;
}

interface AttentionBannerProps {
  items: AttentionItem[];
  onAction?: (actionType: string) => void;
}

export function AttentionBanner({ items, onAction }: AttentionBannerProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-rose-500 font-mono">
          Human Attention Required ({items.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => {
          const isCritical = item.severity === 'critical';
          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border backdrop-blur-md flex items-start justify-between gap-3 shadow-sm transition-all ${
                isCritical
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isCritical ? (
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight">{item.title}</h4>
                  <p className="text-xs mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">{item.message}</p>
                </div>
              </div>

              {item.actionText && item.actionType && onAction && (
                <button
                  onClick={() => onAction(item.actionType!)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                    isCritical
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
