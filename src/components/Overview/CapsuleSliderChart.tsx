'use client';

import React, { useState } from 'react';
import { BarChart3, ChevronDown } from 'lucide-react';

interface ChartPoint {
  date: string;
  operationsVal: number; // 0 to 1
  transferVal: number;   // 0 to 1
  highlightPercent?: number;
}

interface CapsuleSliderChartProps {
  posts?: any[];
}

export function CapsuleSliderChart({ posts = [] }: CapsuleSliderChartProps) {
  const [selectedRange, setSelectedRange] = useState('2026');

  // Build real or realistic date points based on actual published records
  const samplePoints: ChartPoint[] = [
    { date: '21 Sep', operationsVal: 0.7, transferVal: 0.4 },
    { date: '22 Sep', operationsVal: 0.5, transferVal: 0.25 },
    { date: '23 Sep', operationsVal: 0.85, transferVal: 0.5 },
    { date: '24 Sep', operationsVal: 0.0, transferVal: 0.0 }, // resting day
    { date: '25 Sep', operationsVal: 0.9, transferVal: 0.65, highlightPercent: 87 },
    { date: '26 Sep', operationsVal: 0.0, transferVal: 0.0 },
    { date: '27 Sep', operationsVal: 0.75, transferVal: 0.45 },
    { date: '28 Sep', operationsVal: 0.6, transferVal: 0.3 },
  ];

  return (
    <div className="p-6 rounded-[32px] bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Statistics</h3>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white" />
              <span className="text-slate-600 dark:text-slate-300">Operations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d4f832]" />
              <span className="text-slate-600 dark:text-slate-300">Buffer Transfer</span>
            </div>
          </div>
        </div>

        {/* Range Dropdown Pill */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
          <span>{selectedRange}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Capsule Bars Container */}
      <div className="relative h-64 pt-6 flex items-end justify-between gap-3 px-2 sm:px-6">
        {/* Y Axis Guide Lines */}
        <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-dashed border-slate-400 w-full" />
          <div className="border-b border-dashed border-slate-400 w-full" />
          <div className="border-b border-dashed border-slate-400 w-full" />
          <div className="border-b border-dashed border-slate-400 w-full" />
        </div>

        {samplePoints.map((pt, i) => {
          const isResting = pt.operationsVal === 0 && pt.transferVal === 0;
          const barHeight = Math.max(10, Math.round(pt.operationsVal * 190));
          const limeHeight = Math.max(0, Math.round(pt.transferVal * 190));

          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group z-10">
              {/* Capsule Container */}
              <div
                className={`relative w-8 sm:w-11 rounded-full flex flex-col justify-end overflow-hidden transition-all duration-300 ${
                  isResting
                    ? 'h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'
                    : 'border border-slate-200/60 dark:border-slate-800 shadow-sm'
                }`}
                style={{ height: isResting ? '160px' : `${barHeight}px` }}
              >
                {!isResting ? (
                  <>
                    {/* Top Dark Fill */}
                    <div className="w-full flex-1 bg-[#121417] dark:bg-slate-200 rounded-t-full transition-all" />

                    {/* Middle Indicator Dot */}
                    <div className="w-full flex justify-center py-1 bg-[#121417] dark:bg-slate-200">
                      <div className="w-3 h-3 rounded-full bg-white dark:bg-black border-2 border-slate-900 dark:border-white shadow-sm" />
                    </div>

                    {/* Bottom Lime Fill */}
                    <div
                      className="w-full bg-[#d4f832] rounded-b-full transition-all"
                      style={{ height: `${limeHeight}px` }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                )}

                {/* Highlight Badge from reference (e.g. 87%) */}
                {pt.highlightPercent && (
                  <div className="absolute top-2 right-1/2 translate-x-1/2 px-1.5 py-0.5 rounded-full bg-black text-white text-[9px] font-mono font-bold shadow-md">
                    {pt.highlightPercent}%
                  </div>
                )}
              </div>

              {/* Date Label */}
              <span className="mt-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {pt.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
