'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Calendar,
  User,
  LogOut,
} from 'lucide-react';
import { ApiClient } from '@innozverse/api-client';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

const userMenuItems = [
  {
    title: 'Overview',
    href: '/my',
    icon: LayoutDashboard,
  },
  {
    title: 'Browse Catalog',
    href: '/my/browse',
    icon: ShoppingBag,
  },
  {
    title: 'Rent Equipment',
    href: '/my/rent',
    icon: PlusCircle,
    isPrimary: true,
  },
  {
    title: 'My Rentals',
    href: '/my/rentals',
    icon: Calendar,
  },
  {
    title: 'Profile',
    href: '/my/profile',
    icon: User,
  },
];

export function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();

        if (!refreshToken) {
          router.push('/login');
          return;
        }

        try {
          await apiClient.refresh();
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          router.push('/login');
          return;
        }

        const response = await apiClient.getMe();
        setUser({
          name: response.data.user.name,
          email: response.data.user.email,
        });
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      apiClient.clearTokens();
      router.push('/login');
    }
  };

  const isActive = (href: string) => {
    if (href === '/my') {
      return pathname === '/my';
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              innozverse
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {userMenuItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  item.isPrimary && !active
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    : active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t p-4">
          {loading ? (
            <div className="flex items-center space-x-3 rounded-lg px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                <div className="h-2 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-3 rounded-lg px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-sm overflow-hidden">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
