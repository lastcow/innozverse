'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@innozverse/api-client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

// Admin roles that can access the dashboard
const ADMIN_ROLES = ['admin', 'super_user'];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const refreshToken = apiClient.getRefreshToken();

      if (!refreshToken) {
        router.push('/login?redirect=/dashboard');
        return;
      }

      try {
        await apiClient.refresh();

        // Check user role
        const response = await apiClient.getMe();
        const userRole = response.data.user.role;

        if (!ADMIN_ROLES.includes(userRole)) {
          // Non-admin users are redirected to user dashboard
          router.push('/my');
          return;
        }

        setIsAuthorized(true);
      } catch {
        router.push('/login?redirect=/dashboard');
      }
    };

    checkAuth();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
