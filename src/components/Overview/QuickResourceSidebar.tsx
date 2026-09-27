'use client';

import React from 'react';
import {
  MessageSquare,
  GraduationCap,
  ArrowUpRight,
  HardDrive,
  Film,
  Github,
  Flame,
  HelpCircle,
  FolderGit2,
} from 'lucide-react';

export function QuickResourceSidebar() {
  const resourceLinks = [
    {
      title: 'Meta Graph API v21.0',
      description: 'Official Instagram Reels endpoints',
      href: 'https://developers.facebook.com/docs/instagram-platform/instagram-graph-api',
      icon: Flame,
    },
    {
      title: 'Google Drive Master',
      description: 'Source videos library',
      href: 'https://drive.google.com/drive/folders/1VC5hQbbCsNk9LN1CbHshvDZ6CwxxmmOi',
      icon: Film,
    },
    {
      title: 'Hugging Face CDN',
      description: 'Public rolling buffer storage',
      href: 'https://huggingface.co/datasets/isubhanmalik/Bucket',
      icon: HardDrive,
    },
    {
      title: 'GitHub Actions Workers',
      description: 'Batch runner workflows & logs',
      href: 'https://github.com/Subhan-Builds/IG-UPLOAD-ENGINE/actions',
      icon: Github,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 2 Square Feature Cards side-by-side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-[24px] bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col items-center text-center space-y-2 group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="font-bold text-xs text-slate-900 dark:text-white">Community</span>
        </div>

        <div className="p-4 rounded-[24px] bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col items-center text-center space-y-2 group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-xs text-slate-900 dark:text-white">Academy</span>
        </div>
      </div>

      {/* Vertical Resource List Cards */}
      <div className="space-y-2.5">
        {resourceLinks.map((item, idx) => {
          const Icon = item.icon;
          return (
            <a
              key={idx}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-[24px] bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
                </div>
              </div>

              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors shrink-0 ml-2" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
