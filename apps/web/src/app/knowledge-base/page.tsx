'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  ApiClient,
  KBCategoryWithChildren,
  KBArticleWithDetails,
} from '@innozverse/api-client';
import {
  Search,
  FileText,
  Eye,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Folder,
  Sparkles,
  DollarSign,
  HeadphonesIcon,
  LayoutDashboard,
  Calendar,
} from 'lucide-react';

import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

// Recursive category tree component
function CategoryTree({
  categories,
  selectedCategory,
  onSelectCategory,
  expandedIds,
  onToggleExpand,
  level = 0,
}: {
  categories: KBCategoryWithChildren[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  level?: number;
}) {
  return (
    <>
      {categories.map((category) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.has(category.id);
        const isSelected = selectedCategory === category.id;

        return (
          <div key={category.id}>
            <div
              className={`flex items-center rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF] font-medium'
                  : 'text-[#8B949E] hover:bg-[#21262D] hover:text-white'
              }`}
              style={{ paddingLeft: `${level * 16 + 12}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand(category.id);
                  }}
                  className="p-0.5 mr-2 hover:bg-[#30363D] rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="w-5 mr-2" />
              )}
              <button
                onClick={() => onSelectCategory(category.id)}
                className="flex items-center flex-1 min-w-0"
              >
                <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{category.name}</span>
              </button>
              {category.article_count !== undefined && category.article_count > 0 && (
                <span className="ml-auto text-xs text-[#484F58] pl-2">
                  {category.article_count}
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <CategoryTree
                categories={category.children!}
                selectedCategory={selectedCategory}
                onSelectCategory={onSelectCategory}
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

function KnowledgeBaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');

  // Auth state
  const [user, setUser] = useState<{ name: string } | null>(null);

  // Data state
  const [articles, setArticles] = useState<KBArticleWithDetails[]>([]);
  const [categories, setCategories] = useState<KBCategoryWithChildren[]>([]);
  const [flatCategories, setFlatCategories] = useState<KBCategoryWithChildren[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl || '');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [limit] = useState(10);

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (refreshToken) {
          await apiClient.refresh();
          const response = await apiClient.getMe();
          setUser({ name: response.data.user.name });
        }
      } catch {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  // Sync selectedCategory with URL
  useEffect(() => {
    setSelectedCategory(categoryFromUrl || '');
  }, [categoryFromUrl]);

  // Helper to flatten categories for lookup
  const flattenCategories = (cats: KBCategoryWithChildren[]): KBCategoryWithChildren[] => {
    const result: KBCategoryWithChildren[] = [];
    const traverse = (items: KBCategoryWithChildren[]) => {
      for (const cat of items) {
        result.push(cat);
        if (cat.children) traverse(cat.children);
      }
    };
    traverse(cats);
    return result;
  };

  // Find ancestors for auto-expand
  const findAncestorIds = (
    cats: KBCategoryWithChildren[],
    targetId: string,
    ancestors: string[] = []
  ): string[] | null => {
    for (const cat of cats) {
      if (cat.id === targetId) return ancestors;
      if (cat.children) {
        const found = findAncestorIds(cat.children, targetId, [...ancestors, cat.id]);
        if (found) return found;
      }
    }
    return null;
  };

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.listKBCategories({
        include_children: true,
        include_article_count: true,
      });
      setCategories(response.data.categories);
      setFlatCategories(flattenCategories(response.data.categories));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch articles (published only)
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        status: 'published', // Only published articles
      };

      if (selectedCategory) {
        params.category_id = selectedCategory;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await apiClient.listKBArticles(params);
      setArticles(response.data.articles);
      setTotalPages(response.data.pagination.totalPages);
      setTotalArticles(response.data.pagination.total);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, selectedCategory, searchQuery]);

  // Initialize
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Auto-expand ancestors when category changes
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const ancestors = findAncestorIds(categories, selectedCategory);
      if (ancestors && ancestors.length > 0) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          ancestors.forEach((id) => next.add(id));
          return next;
        });
      }
    }
  }, [selectedCategory, categories]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    router.push(`/knowledge-base?category=${categoryId}`);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setCurrentPage(1);
    router.push('/knowledge-base');
  };

  const getCategoryName = (categoryId: string) => {
    const cat = flatCategories.find((c) => c.id === categoryId);
    return cat?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#161B22]/90 backdrop-blur-md border-b border-[#30363D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] to-[#3DDC97]">
                innoZverse
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="flex items-center gap-2 text-[#8B949E] hover:text-white transition-colors">
                <Sparkles className="h-4 w-4" />
                <span>Features</span>
              </Link>
              <Link href="/pricing" className="flex items-center gap-2 text-[#8B949E] hover:text-white transition-colors">
                <DollarSign className="h-4 w-4" />
                <span>Pricing</span>
              </Link>
              <Link href="/knowledge-base" className="flex items-center gap-2 text-white hover:text-white transition-colors">
                <BookOpen className="h-4 w-4" />
                <span>Knowledge Base</span>
              </Link>
              <Link href="/#support" className="flex items-center gap-2 text-[#8B949E] hover:text-white transition-colors">
                <HeadphonesIcon className="h-4 w-4" />
                <span>Support</span>
              </Link>
              {user && (
                <Link href="/dashboard" className="flex items-center gap-2 text-[#8B949E] hover:text-white transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <span className="hidden sm:inline-block text-white/90">{user.name}</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#00D9FF] to-[#3DDC97] flex items-center justify-center text-[#0D1117] text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:inline-block text-[#8B949E] hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link href="/login">
                    <Button className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Knowledge Base
            </h1>
            <p className="text-xl text-[#8B949E] max-w-2xl mx-auto">
              Explore our comprehensive documentation and tutorials
            </p>
          </div>

          <div className="flex gap-8">
            {/* Category Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-[#161B22] border border-[#30363D] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
                <button
                  onClick={clearFilters}
                  className={`w-full flex items-center rounded-lg px-3 py-2 text-sm transition-colors mb-2 ${
                    !selectedCategory
                      ? 'bg-[#00D9FF]/20 text-[#00D9FF] font-medium'
                      : 'text-[#8B949E] hover:bg-[#21262D] hover:text-white'
                  }`}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  All Articles
                </button>
                {categories.length > 0 ? (
                  <CategoryTree
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleCategorySelect}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                  />
                ) : (
                  <p className="text-[#484F58] text-sm">No categories found</p>
                )}
              </div>
            </aside>

            {/* Articles List */}
            <main className="flex-1 min-w-0">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#484F58]" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 bg-[#21262D] border-[#30363D] text-white placeholder:text-[#484F58] focus:border-[#00D9FF]"
                  />
                </div>
              </div>

              {/* Mobile Category Filter */}
              <div className="lg:hidden mb-6">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full px-4 py-2 bg-[#21262D] border border-[#30363D] rounded-lg text-white"
                >
                  <option value="">All Categories</option>
                  {flatCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Filter Display */}
              {selectedCategory && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-[#8B949E] text-sm">Filtering by:</span>
                  <span className="px-3 py-1 bg-[#00D9FF]/20 text-[#00D9FF] rounded-full text-sm flex items-center gap-2">
                    {getCategoryName(selectedCategory)}
                    <button
                      onClick={clearFilters}
                      className="hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}

              {/* Articles */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00D9FF]" />
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="h-16 w-16 mx-auto text-[#30363D] mb-4" />
                  <p className="text-[#8B949E] text-lg">No articles found</p>
                  {(selectedCategory || searchQuery) && (
                    <Button
                      variant="outline"
                      className="mt-4 bg-[#21262D] border-[#30363D] text-white hover:bg-[#30363D]"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <Card
                      key={article.id}
                      className="bg-[#161B22] border-[#30363D] hover:border-[#00D9FF] transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]"
                      onClick={() => router.push(`/knowledge-base/${article.id}`)}
                    >
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-[#8B949E] mb-4 line-clamp-2">
                            {article.summary}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#484F58]">
                          <span className="flex items-center gap-1">
                            <Folder className="h-4 w-4" />
                            {article.category?.name || 'Uncategorized'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {article.view_count} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(article.published_at || article.created_at)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6">
                      <p className="text-sm text-[#484F58]">
                        Showing {(currentPage - 1) * limit + 1} to{' '}
                        {Math.min(currentPage * limit, totalArticles)} of {totalArticles} articles
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="bg-[#21262D] border-[#30363D] text-white hover:bg-[#30363D] disabled:opacity-50"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="bg-[#21262D] border-[#30363D] text-white hover:bg-[#30363D] disabled:opacity-50"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#30363D] py-12 px-4 sm:px-6 lg:px-8 bg-[#161B22]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] mb-4">
                innoZverse
              </div>
              <p className="text-[#8B949E] text-sm">
                A comprehensive learning environment with detailed, ever-growing tutorials for individuals and companies.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/#features" className="text-[#8B949E] hover:text-white transition-colors text-sm">Features</Link></li>
                <li><Link href="/pricing" className="text-[#8B949E] hover:text-white transition-colors text-sm">Pricing</Link></li>
                <li><Link href="/knowledge-base" className="text-[#8B949E] hover:text-white transition-colors text-sm">Knowledge Base</Link></li>
                <li><Link href="/#support" className="text-[#8B949E] hover:text-white transition-colors text-sm">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-[#8B949E] hover:text-white transition-colors text-sm">About Us</Link></li>
                <li><Link href="/privacy" className="text-[#8B949E] hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#30363D] pt-8 text-center text-[#8B949E] text-sm">
            <p>&copy; {new Date().getFullYear()} innoZverse. All rights reserved.</p>
            <p className="mt-2">Developed with <a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer" className="text-[#00D9FF] hover:text-[#33E1FF]">Claude Code</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#00D9FF]" />
        </div>
      }
    >
      <KnowledgeBaseContent />
    </Suspense>
  );
}
