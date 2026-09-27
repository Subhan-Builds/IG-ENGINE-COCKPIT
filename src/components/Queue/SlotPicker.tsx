'use client';

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Globe, Clock } from 'lucide-react';

interface SlotPickerProps {
  initialUtcIso?: string | null;
  onChange: (utcIso: string) => void;
}

export function SlotPicker({ initialUtcIso, onChange }: SlotPickerProps) {
  // Convert UTC ISO to local datetime-local format "YYYY-MM-DDTHH:mm"
  const getInitialLocal = () => {
    if (!initialUtcIso) return '';
    try {
      const d = new Date(initialUtcIso);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${mins}`;
    } catch {
      return '';
    }
  };

  const [localVal, setLocalVal] = useState<string>(getInitialLocal());
  const [utcDisplay, setUtcDisplay] = useState<string>(() => {
    if (!initialUtcIso) return 'Not set';
    try {
      const d = new Date(initialUtcIso);
      return d.toUTCString();
    } catch {
      return '';
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalVal(val);
    if (!val) return;

    try {
      const d = new Date(val);
      const iso = d.toISOString();
      setUtcDisplay(d.toUTCString());
      onChange(iso);
    } catch (err) {
      console.error('Invalid date input:', err);
    }
  };

  return (
    <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          Schedule Slot Time (PKT)
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Globe className="w-3 h-3" />
          Asia/Karachi (PKT)
        </span>
      </div>

      <input
        type="datetime-local"
        value={localVal}
        onChange={handleChange}
        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111726] text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
        <span>Timezone:</span>
        <span className="text-blue-600 dark:text-blue-400 font-medium">Asia/Karachi (UTC+5)</span>
      </div>
    </div>
  );
}
