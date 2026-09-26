import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number | null | undefined, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unscheduled';
  try {
    const d = new Date(dateStr);
    return format(d, 'MMM d, yyyy · HH:mm');
  } catch {
    return dateStr;
  }
}

export function formatTimeUTC(dateStr: string | null | undefined): string {
  if (!dateStr) return '--:--';
  try {
    const d = new Date(dateStr);
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m} UTC`;
  } catch {
    return '--:--';
  }
}

export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  try {
    const d = new Date(dateStr);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'published':
      return {
        bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        dot: 'bg-emerald-500',
        label: 'Published',
      };
    case 'scheduled':
      return {
        bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        dot: 'bg-blue-500',
        label: 'Scheduled',
      };
    case 'hf_ready':
      return {
        bg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
        dot: 'bg-cyan-500',
        label: 'Buffer Ready',
      };
    case 'publish_pending':
      return {
        bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        dot: 'bg-amber-500 animate-pulse',
        label: 'Publishing...',
      };
    case 'importing':
      return {
        bg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        dot: 'bg-indigo-500 animate-pulse',
        label: 'Importing...',
      };
    case 'publish_failed':
    case 'import_failed':
      return {
        bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        dot: 'bg-rose-500',
        label: status === 'publish_failed' ? 'Publish Failed' : 'Import Failed',
      };
    case 'skipped':
      return {
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        dot: 'bg-slate-400',
        label: 'Skipped',
      };
    case 'discovered':
    default:
      return {
        bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        dot: 'bg-violet-400',
        label: 'Discovered',
      };
  }
}
