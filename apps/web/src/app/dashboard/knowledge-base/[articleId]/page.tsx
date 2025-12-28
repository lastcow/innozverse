'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MarkdownRenderer } from '@/components/kb/markdown-renderer';
import { ApiClient, KBArticleWithDetails } from '@innozverse/api-client';
import {
  ArrowLeft,
  Pencil,
  Eye,
  Calendar,
  FolderTree,
  User,
  Star,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.innozverse.com'
);

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.articleId as string;

  const [article, setArticle] = useState<KBArticleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getKBArticle(articleId);
      setArticle(response.data.article);

      // Increment view count
      await apiClient.incrementKBArticleView(articleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

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

        await fetchArticle();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }
    init();
  }, [fetchArticle]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !article) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Article not found'}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const statusBadge = getStatusBadge(article.status);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/dashboard/knowledge-base')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/knowledge-base?edit=${article.id}`)
              }
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Article
            </Button>
          )}
        </div>

        {/* Article Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {article.is_featured && (
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  )}
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full border ${statusBadge.className}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>
                <h1 className="text-3xl font-bold mb-3">{article.title}</h1>
                {article.summary && (
                  <p className="text-lg text-muted-foreground mb-4">
                    {article.summary}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FolderTree className="h-4 w-4" />
                    {article.category?.name || 'Uncategorized'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.view_count} views
                  </span>
                  {article.author && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {article.author.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(article.published_at || article.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Article Content */}
        <Card>
          <CardContent className="p-6 md:p-8">
            <MarkdownRenderer content={article.content} />
          </CardContent>
        </Card>

        {/* Navigation Footer */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/knowledge-base')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
