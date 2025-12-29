'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart3,
  Package,
  LogOut,
  Monitor,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { ApiClient, KBCategoryWithChildren } from '@innozverse/api-client';

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.innozverse.com'
);

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Projects',
    href: '/dashboard/projects',
    icon: Package,
  },
  {
    title: 'Equipment',
    href: '/dashboard/equipment',
    icon: Monitor,
  },
  {
    title: 'Rentals',
    href: '/dashboard/rentals',
    icon: Calendar,
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    title: 'Documents',
    href: '/dashboard/documents',
    icon: FileText,
  },
  {
    title: 'Knowledge Base',
    href: '/dashboard/knowledge-base',
    icon: BookOpen,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

// Helper to find ancestor IDs of a category
function findAncestorIds(
  categories: KBCategoryWithChildren[],
  targetId: string,
  ancestors: string[] = []
): string[] | null {
  for (const cat of categories) {
    if (cat.id === targetId) {
      return ancestors;
    }
    if (cat.children && cat.children.length > 0) {
      const found = findAncestorIds(cat.children, targetId, [...ancestors, cat.id]);
      if (found) return found;
    }
  }
  return null;
}

// Recursive component for nested categories
function CategoryMenuItem({
  categories,
  selectedCategoryId,
  expandedIds,
  onToggleExpand,
  level,
}: {
  categories: KBCategoryWithChildren[];
  selectedCategoryId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  level: number;
}) {
  return (
    <>
      {categories.map((category) => {
        const categoryUrl = `/dashboard/knowledge-base?category=${category.id}`;
        const isCategoryActive = selectedCategoryId === category.id;
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.has(category.id);

        return (
          <div key={category.id}>
            <div
              className={cn(
                'flex items-center rounded-lg px-2 py-1.5 text-sm transition-colors',
                isCategoryActive
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => onToggleExpand(category.id)}
                  className="p-0.5 mr-1 hover:bg-black/10 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              ) : (
                <span className="w-4 mr-1" />
              )}
              <Link href={categoryUrl} className="flex items-center flex-1 min-w-0">
                <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{category.name}</span>
              </Link>
              {category.article_count !== undefined && category.article_count > 0 && (
                <span className="ml-auto text-xs text-muted-foreground pl-2">
                  {category.article_count}
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <CategoryMenuItem
                categories={category.children!}
                selectedCategoryId={selectedCategoryId}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [kbCategories, setKbCategories] = useState<KBCategoryWithChildren[]>([]);
  const [kbExpanded, setKbExpanded] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());

  // Get selected category from URL and auto-expand ancestors
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/dashboard/knowledge-base') {
      const params = new URLSearchParams(window.location.search);
      const categoryId = params.get('category');
      setSelectedCategoryId(categoryId);

      // Auto-expand ancestors of selected category
      if (categoryId && kbCategories.length > 0) {
        const ancestors = findAncestorIds(kbCategories, categoryId);
        if (ancestors && ancestors.length > 0) {
          setExpandedCategoryIds((prev) => {
            const next = new Set(prev);
            ancestors.forEach((id) => next.add(id));
            return next;
          });
        }
      }
    } else {
      setSelectedCategoryId(null);
    }
  }, [pathname, kbCategories]);

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get the access token from localStorage
        const refreshToken = apiClient.getRefreshToken();

        if (!refreshToken) {
          // No token found, redirect to login
          router.push('/login');
          return;
        }

        // Try to refresh the token first to ensure we have a valid access token
        try {
          await apiClient.refresh();
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          router.push('/login');
          return;
        }

        // Now fetch user data
        const response = await apiClient.getMe();
        setUser({
          name: response.data.user.name,
          email: response.data.user.email,
        });

        // Fetch KB categories
        try {
          const catResponse = await apiClient.listKBCategories({
            include_children: true,
            include_article_count: true,
          });
          setKbCategories(catResponse.data.categories);
        } catch (catError) {
          console.error('Failed to fetch KB categories:', catError);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // If failed to fetch user, redirect to login
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // Auto-expand KB menu if on KB page
  useEffect(() => {
    if (pathname?.startsWith('/dashboard/knowledge-base')) {
      setKbExpanded(true);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear tokens anyway and redirect
      apiClient.clearTokens();
      router.push('/login');
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              innozverse
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const isKbItem = item.href === '/dashboard/knowledge-base';
            const isKbPage = pathname?.startsWith('/dashboard/knowledge-base');

            // Special rendering for Knowledge Base with categories
            if (isKbItem) {
              return (
                <div key={item.href}>
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
                      isKbPage
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    onClick={() => setKbExpanded(!kbExpanded)}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center space-x-3 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                    {kbCategories.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setKbExpanded(!kbExpanded);
                        }}
                        className="p-0.5"
                      >
                        {kbExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  {/* KB Categories submenu */}
                  {kbExpanded && kbCategories.length > 0 && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      <CategoryMenuItem
                        categories={kbCategories}
                        selectedCategoryId={selectedCategoryId}
                        expandedIds={expandedCategoryIds}
                        onToggleExpand={toggleCategoryExpand}
                        level={0}
                      />
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
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
