'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@innozverse/api-client';
import { UserDashboardLayout } from '@/components/layout/user-dashboard-layout';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

export default function MyLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const refreshToken = apiClient.getRefreshToken();

      if (!refreshToken) {
        router.push('/login?redirect=/my');
        return;
      }

      try {
        await apiClient.refresh();
        setIsAuthorized(true);
      } catch {
        router.push('/login?redirect=/my');
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

  return <UserDashboardLayout>{children}</UserDashboardLayout>;
}
