import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { Footer } from './footer';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="pl-64">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-9rem)] pt-16 px-6 py-6">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
