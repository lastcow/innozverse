'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/kb/markdown-renderer';
import { ApiClient, KBArticleWithDetails } from '@innozverse/api-client';
import {
  ArrowLeft,
  Eye,
  Calendar,
  Folder,
  User,
  Loader2,
  Sparkles,
  DollarSign,
  HeadphonesIcon,
  BookOpen,
  LayoutDashboard,
  AlertCircle,
} from 'lucide-react';

import { config } from '@/lib/config';
import { UserMenu } from '@/components/layout/user-menu';

const apiClient = new ApiClient(config.apiBaseUrl);

export default function PublicArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.articleId as string;

  const [article, setArticle] = useState<KBArticleWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string } | null>(null);

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

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getKBArticle(articleId);
      const fetchedArticle = response.data.article;

      // Only show published articles publicly
      if (fetchedArticle.status !== 'published') {
        setError('Article not found');
        return;
      }

      setArticle(fetchedArticle);

      // Increment view count
      try {
        await apiClient.incrementKBArticleView(articleId);
      } catch {
        // Ignore view count errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article');
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
                <UserMenu userName={user.name} />
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
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-[#00D9FF]" />
            </div>
          ) : error || !article ? (
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 mx-auto text-[#F85149] mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Article Not Found</h2>
              <p className="text-[#8B949E] mb-6">{error || 'The article you are looking for does not exist.'}</p>
              <Button
                onClick={() => router.push('/knowledge-base')}
                className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Knowledge Base
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => router.push('/knowledge-base')}
                className="text-[#8B949E] hover:text-white hover:bg-[#21262D]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Knowledge Base
              </Button>

              {/* Article Header */}
              <Card className="bg-[#161B22] border-[#30363D]">
                <CardContent className="p-6 md:p-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    {article.title}
                  </h1>
                  {article.summary && (
                    <p className="text-lg text-[#8B949E] mb-6">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#484F58]">
                    <span className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      {article.category?.name || 'Uncategorized'}
                    </span>
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      {article.view_count} views
                    </span>
                    {article.author && (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {article.author.name}
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(article.published_at || article.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Article Content */}
              <Card className="bg-[#161B22] border-[#30363D]">
                <CardContent className="p-6 md:p-8">
                  <MarkdownRenderer content={article.content} />
                </CardContent>
              </Card>

              {/* Bottom Navigation */}
              <div className="flex justify-center pt-6">
                <Button
                  onClick={() => router.push('/knowledge-base')}
                  className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Knowledge Base
                </Button>
              </div>
            </div>
          )}
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
