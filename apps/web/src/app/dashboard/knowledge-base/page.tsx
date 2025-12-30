'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ApiClient,
  KBCategoryWithChildren,
  KBArticleWithDetails,
} from '@innozverse/api-client';
import {
  Plus,
  Search,
  FileText,
  FolderTree,
  Eye,
  Star,
  Loader2,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Upload,
  BookOpen,
  List,
} from 'lucide-react';

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.innozverse.com'
);

type TabType = 'all' | 'published' | 'drafts' | 'featured';

function KnowledgeBaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');

  // Data state
  const [articles, setArticles] = useState<KBArticleWithDetails[]>([]);
  const [flatCategories, setFlatCategories] = useState<KBCategoryWithChildren[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl || '');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Sync selectedCategory with URL
  useEffect(() => {
    setSelectedCategory(categoryFromUrl || '');
  }, [categoryFromUrl]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const [limit] = useState(10);

  // Stats
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalCategories: 0,
    totalViews: 0,
    publishedCount: 0,
  });

  // Dialogs
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KBCategoryWithChildren | null>(null);
  const [editingArticle, setEditingArticle] = useState<KBArticleWithDetails | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<KBArticleWithDetails | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<KBCategoryWithChildren | null>(null);

  // Actions menu
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Form state for category dialog
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    parent_id: '',
    icon: '',
  });

  // Form state for article dialog
  const [articleForm, setArticleForm] = useState({
    category_id: '',
    title: '',
    summary: '',
    content: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    is_featured: false,
  });

  // Import state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importCategoryId, setImportCategoryId] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Click outside handler for actions menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setOpenActionsMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch categories for dropdowns
  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.listKBCategories({
        include_article_count: true,
      });
      setFlatCategories(response.data.categories);
      setStats((prev) => ({
        ...prev,
        totalCategories: response.data.categories.length,
      }));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
      };

      if (selectedCategory) {
        params.category_id = selectedCategory;
      }

      if (activeTab === 'published') {
        params.status = 'published';
      } else if (activeTab === 'drafts') {
        params.status = 'draft';
      } else if (activeTab === 'featured') {
        params.is_featured = true;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await apiClient.listKBArticles(params);
      setArticles(response.data.articles);
      setTotalPages(response.data.pagination.totalPages);
      setTotalArticles(response.data.pagination.total);

      // Update stats
      if (activeTab === 'all' && !selectedCategory && !searchQuery) {
        setStats((prev) => ({
          ...prev,
          totalArticles: response.data.pagination.total,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, selectedCategory, activeTab, searchQuery]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      // Get all articles for stats
      const allResponse = await apiClient.listKBArticles({ limit: 1 });
      const publishedResponse = await apiClient.listKBArticles({
        status: 'published',
        limit: 1,
      });

      setStats((prev) => ({
        ...prev,
        totalArticles: allResponse.data.pagination.total,
        publishedCount: publishedResponse.data.pagination.total,
      }));
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          apiClient.setRefreshToken(refreshToken);
          await apiClient.refresh();
        }

        const meResponse = await apiClient.getMe();
        const role = meResponse.data.user.role;
        setIsAdmin(['admin', 'super_user'].includes(role));

        await Promise.all([fetchCategories(), fetchStats()]);
        setInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }
    init();
  }, [fetchCategories, fetchStats]);

  // Fetch articles when filters change (only after initialized)
  useEffect(() => {
    if (initialized) {
      fetchArticles();
    }
  }, [fetchArticles, initialized]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Open article editor
  const openArticleEditor = (article?: KBArticleWithDetails) => {
    if (article) {
      setEditingArticle(article);
      setArticleForm({
        category_id: article.category_id,
        title: article.title,
        summary: article.summary || '',
        content: article.content,
        status: article.status,
        is_featured: article.is_featured,
      });
    } else {
      setEditingArticle(null);
      setArticleForm({
        category_id: selectedCategory || (flatCategories[0]?.id || ''),
        title: '',
        summary: '',
        content: '',
        status: 'draft',
        is_featured: false,
      });
    }
    setShowArticleDialog(true);
  };

  // Open category editor
  const openCategoryEditor = (category?: KBCategoryWithChildren) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        parent_id: category.parent_id || '',
        icon: category.icon || '',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        parent_id: '',
        icon: '',
      });
    }
    setShowCategoryDialog(true);
  };

  // Save category
  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await apiClient.updateKBCategory(editingCategory.id, {
          name: categoryForm.name,
          description: categoryForm.description || undefined,
          parent_id: categoryForm.parent_id || null,
          icon: categoryForm.icon || undefined,
        });
      } else {
        await apiClient.createKBCategory({
          name: categoryForm.name,
          description: categoryForm.description || undefined,
          parent_id: categoryForm.parent_id || undefined,
          icon: categoryForm.icon || undefined,
        });
      }
      setShowCategoryDialog(false);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    }
  };

  // Save article
  const handleSaveArticle = async () => {
    try {
      if (editingArticle) {
        await apiClient.updateKBArticle(editingArticle.id, {
          category_id: articleForm.category_id,
          title: articleForm.title,
          summary: articleForm.summary || undefined,
          content: articleForm.content,
          status: articleForm.status,
          is_featured: articleForm.is_featured,
        });
      } else {
        await apiClient.createKBArticle({
          category_id: articleForm.category_id,
          title: articleForm.title,
          summary: articleForm.summary || undefined,
          content: articleForm.content,
          status: articleForm.status,
          is_featured: articleForm.is_featured,
        });
      }
      setShowArticleDialog(false);
      await Promise.all([fetchArticles(), fetchCategories(), fetchStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    }
  };

  // Delete article
  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    try {
      await apiClient.deleteKBArticle(articleToDelete.id);
      setArticleToDelete(null);
      await Promise.all([fetchArticles(), fetchCategories(), fetchStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await apiClient.deleteKBCategory(categoryToDelete.id);
      setCategoryToDelete(null);
      if (selectedCategory === categoryToDelete.id) {
        setSelectedCategory('');
      }
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  // Handle file import
  const handleFileImport = async () => {
    if (!importFile || !importCategoryId || !importTitle) return;

    try {
      const content = await importFile.text();
      await apiClient.importKBArticle({
        category_id: importCategoryId,
        title: importTitle,
        content,
        status: 'draft',
      });
      setShowImportDialog(false);
      setImportFile(null);
      setImportCategoryId('');
      setImportTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await Promise.all([fetchArticles(), fetchCategories(), fetchStats()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import article');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      draft: {
        label: 'Draft',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      published: {
        label: 'Published',
        className: 'bg-green-100 text-green-700 border-green-200',
      },
      archived: {
        label: 'Archived',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      },
    };
    return badges[status] || badges.draft;
  };

  // View article
  const viewArticle = (article: KBArticleWithDetails) => {
    router.push(`/dashboard/knowledge-base/${article.id}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground">
              Manage articles and documentation
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" onClick={() => openCategoryEditor()}>
                <FolderTree className="h-4 w-4 mr-2" />
                New Category
              </Button>
              <Button onClick={() => openArticleEditor()}>
                <Plus className="h-4 w-4 mr-2" />
                New Article
              </Button>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Articles
                  </p>
                  <p className="text-2xl font-bold mt-1">{stats.totalArticles}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Categories
                  </p>
                  <p className="text-2xl font-bold mt-1">{stats.totalCategories}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FolderTree className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Published
                  </p>
                  <p className="text-2xl font-bold mt-1">{stats.publishedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Views
                  </p>
                  <p className="text-2xl font-bold mt-1">{stats.totalViews}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Articles List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Articles</CardTitle>
                  {selectedCategory && (
                    <CardDescription className="mt-1">
                      Showing articles in: {flatCategories.find(c => c.id === selectedCategory)?.name || 'Selected category'}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Category Dropdown */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                      // Update URL
                      const params = new URLSearchParams(searchParams.toString());
                      if (e.target.value) {
                        params.set('category', e.target.value);
                      } else {
                        params.delete('category');
                      }
                      router.push(`/dashboard/knowledge-base?${params.toString()}`);
                    }}
                    className="px-3 py-2 border rounded-md text-sm bg-background min-w-[160px]"
                  >
                    <option value="">All Categories</option>
                    {flatCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  {/* View All in Category Button */}
                  {selectedCategory && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveTab('all');
                        setCurrentPage(1);
                      }}
                      title="Show all articles in selected category (all statuses)"
                    >
                      <List className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  )}

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              {isAdmin && (
                <div className="flex items-center gap-1 mt-4 border-b">
                  {(['all', 'published', 'drafts', 'featured'] as TabType[]).map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === tab
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    )
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No articles found</p>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => openArticleEditor()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Article
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => {
                    const statusBadge = getStatusBadge(article.status);
                    return (
                      <div
                        key={article.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => viewArticle(article)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{article.title}</h3>
                            {article.is_featured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full border ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {article.summary || 'No summary'}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FolderTree className="h-3 w-3" />
                              {article.category?.name || 'Uncategorized'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.view_count} views
                            </span>
                            {article.author && (
                              <span>By {article.author.name}</span>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <div
                            className="relative"
                            ref={openActionsMenu === article.id ? actionsMenuRef : null}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setOpenActionsMenu(
                                  openActionsMenu === article.id ? null : article.id
                                )
                              }
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                            {openActionsMenu === article.id && (
                              <div className="absolute right-0 mt-2 w-40 bg-background border rounded-lg shadow-lg z-10 py-1">
                                <button
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                                  onClick={() => {
                                    setOpenActionsMenu(null);
                                    openArticleEditor(article);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
                                  onClick={() => {
                                    setOpenActionsMenu(null);
                                    setArticleToDelete(article);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * limit + 1} to{' '}
                        {Math.min(currentPage * limit, totalArticles)} of{' '}
                        {totalArticles} articles
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Dialog */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>
                {editingCategory ? 'Edit Category' : 'New Category'}
              </CardTitle>
              <CardDescription>
                {editingCategory
                  ? 'Update category details'
                  : 'Create a new category for your articles'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, description: e.target.value })
                  }
                  placeholder="Brief description"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Parent Category</label>
                <select
                  value={categoryForm.parent_id}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, parent_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">No parent (root category)</option>
                  {flatCategories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-between pt-4">
                {editingCategory && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowCategoryDialog(false);
                      setCategoryToDelete(editingCategory);
                    }}
                  >
                    Delete
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    onClick={() => setShowCategoryDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveCategory}
                    disabled={!categoryForm.name.trim()}
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Article Dialog */}
      {showArticleDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingArticle ? 'Edit Article' : 'New Article'}
              </CardTitle>
              <CardDescription>
                {editingArticle
                  ? 'Update article content'
                  : 'Create a new knowledge base article'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category *</label>
                  <select
                    value={articleForm.category_id}
                    onChange={(e) =>
                      setArticleForm({ ...articleForm, category_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Select category</option>
                    {flatCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={articleForm.status}
                    onChange={(e) =>
                      setArticleForm({
                        ...articleForm,
                        status: e.target.value as 'draft' | 'published' | 'archived',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={articleForm.title}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, title: e.target.value })
                  }
                  placeholder="Article title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Summary</label>
                <textarea
                  value={articleForm.summary}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, summary: e.target.value })
                  }
                  placeholder="Brief summary (optional)"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content * (Markdown)</label>
                <textarea
                  value={articleForm.content}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, content: e.target.value })
                  }
                  placeholder="Write your article in Markdown..."
                  className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                  rows={15}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={articleForm.is_featured}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, is_featured: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="is_featured" className="text-sm">
                  Featured article
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowArticleDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveArticle}
                  disabled={
                    !articleForm.category_id ||
                    !articleForm.title.trim() ||
                    !articleForm.content.trim()
                  }
                >
                  {editingArticle ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Import Markdown File</CardTitle>
              <CardDescription>
                Upload a .md file to create a new article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={importCategoryId}
                  onChange={(e) => setImportCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Select category</option>
                  {flatCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Article Title *</label>
                <Input
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="Title for the imported article"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Markdown File *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.markdown"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportFile(null);
                    setImportCategoryId('');
                    setImportTitle('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFileImport}
                  disabled={!importFile || !importCategoryId || !importTitle.trim()}
                >
                  Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Article Confirmation */}
      <AlertDialog
        open={!!articleToDelete}
        onOpenChange={() => setArticleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{articleToDelete?.title}&rdquo;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArticle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={() => setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{categoryToDelete?.name}&rdquo;?
              Make sure there are no articles or sub-categories in this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    }>
      <KnowledgeBaseContent />
    </Suspense>
  );
}
