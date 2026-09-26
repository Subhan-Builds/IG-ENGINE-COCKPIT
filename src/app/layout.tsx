import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/themeContext';
import { NotificationToast } from '@/components/UI/NotificationToast';

export const metadata: Metadata = {
  title: 'IG Engine Cockpit — Instagram Automation Control Surface',
  description: 'Production control, observability, research engine, and analytics cockpit for the Instagram Reels automation engine.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen transition-colors duration-200">
        <AppProvider>
          {children}
          <NotificationToast />
        </AppProvider>
      </body>
    </html>
  );
}
