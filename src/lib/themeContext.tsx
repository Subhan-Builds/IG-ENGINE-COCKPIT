'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
export type TabType =
  | 'overview'
  | 'accounts'
  | 'content'
  | 'queue'
  | 'calendar'
  | 'posts'
  | 'analytics'
  | 'experiments'
  | 'health'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  timestamp: number;
}

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  advancedMode: boolean;
  setAdvancedMode: (val: boolean) => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, description?: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('ig_engine_theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setTheme(initial);
      document.documentElement.classList.toggle('dark', initial === 'dark');
    }

    const savedAdvanced = localStorage.getItem('ig_engine_advanced') === 'true';
    setAdvancedMode(savedAdvanced);

    const savedAccount = localStorage.getItem('ig_engine_selected_account');
    if (savedAccount) {
      setSelectedAccountId(savedAccount);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('ig_engine_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const handleSetSelectedAccount = (id: string) => {
    setSelectedAccountId(id);
    localStorage.setItem('ig_engine_selected_account', id);
  };

  const handleSetAdvancedMode = (val: boolean) => {
    setAdvancedMode(val);
    localStorage.setItem('ig_engine_advanced', val ? 'true' : 'false');
    addToast(
      val ? 'warning' : 'info',
      val ? 'Advanced Mode Enabled' : 'Advanced Mode Disabled',
      val ? 'Deeper automation parameters and manual overrides are now unlocked.' : 'Switched back to standard safe operating mode.'
    );
  };

  const addToast = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description, timestamp: Date.now() }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        selectedAccountId,
        setSelectedAccountId: handleSetSelectedAccount,
        advancedMode,
        setAdvancedMode: handleSetAdvancedMode,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
