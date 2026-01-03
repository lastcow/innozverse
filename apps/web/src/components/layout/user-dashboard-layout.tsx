import { ReactNode } from 'react';
import { UserSidebar } from './user-sidebar';
import { Navbar } from './navbar';
import { Footer } from './footer';

interface UserDashboardLayoutProps {
  children: ReactNode;
}

export function UserDashboardLayout({ children }: UserDashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <div className="pl-64">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-9rem)] pt-16">
          <div className="w-full px-6 py-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
