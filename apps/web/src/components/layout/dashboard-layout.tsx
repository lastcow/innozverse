'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { SidebarProvider, useSidebar } from './sidebar-context';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={cn('transition-all duration-300', isCollapsed ? 'pl-16' : 'pl-64')}>
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)] pt-16 py-4 pr-4">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
