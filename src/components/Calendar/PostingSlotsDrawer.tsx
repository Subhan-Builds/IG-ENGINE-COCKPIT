'use client';

import React, { useState } from 'react';
import { Clock, Plus, Trash2, X, Save } from 'lucide-react';
import { useApp } from '@/lib/themeContext';

interface PostingSlotsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  postingTimesStr: string;
  onSave: (newTimes: string) => Promise<void>;
}

export function PostingSlotsDrawer({ isOpen, onClose, postingTimesStr, onSave }: PostingSlotsDrawerProps) {
  const { addToast } = useApp();
  const [slots, setSlots] = useState<string[]>(() =>
    postingTimesStr.split(',').map((s) => s.trim()).filter(Boolean)
  );
  const [newSlot, setNewSlot] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddSlot = () => {
    if (!newSlot || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(newSlot)) {
      addToast('warning', 'Invalid Format', 'Please enter time in HH:MM format (24-hour PKT).');
      return;
    }
    if (slots.includes(newSlot)) {
      addToast('info', 'Duplicate Slot', 'This time slot is already in your schedule.');
      return;
    }
    const updated = [...slots, newSlot].sort();
    setSlots(updated);
    setNewSlot('');
  };

  const handleRemoveSlot = (slotToRemove: string) => {
    if (slots.length <= 1) {
      addToast('warning', 'At least 1 slot required', 'You must maintain at least one daily posting slot.');
      return;
    }
    setSlots(slots.filter((s) => s !== slotToRemove));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(slots.join(','));
      addToast('success', 'Posting Slots Saved', `Daily slots updated to: ${slots.join(', ')} PKT`);
      onClose();
    } catch (err: any) {
      addToast('error', 'Failed to Save Slots', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      <div className="relative w-full max-w-md bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden z-10 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Posting Slots (PKT / Asia-Karachi)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          The Drive Importer assigns scheduled posting times according to these daily Pakistan Standard Time (PKT) slots.
        </p>

        {/* Slots List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {slots.map((slot) => {
            return (
              <div
                key={slot}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{slot} PKT</span>
                  <span className="text-[11px] text-slate-400 font-mono">(Asia/Karachi)</span>
                </div>

                <button
                  onClick={() => handleRemoveSlot(slot)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add Slot */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="e.g. 20:30 (PKT)"
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddSlot}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Slots'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
