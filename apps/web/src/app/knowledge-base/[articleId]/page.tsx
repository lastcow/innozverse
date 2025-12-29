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

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                innoZverse
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <Sparkles className="h-4 w-4" />
                <span>Features</span>
              </Link>
              <Link href="/pricing" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <DollarSign className="h-4 w-4" />
                <span>Pricing</span>
              </Link>
              <Link href="/knowledge-base" className="flex items-center gap-2 text-white hover:text-white transition-colors">
                <BookOpen className="h-4 w-4" />
                <span>Knowledge Base</span>
              </Link>
              <Link href="/#support" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <HeadphonesIcon className="h-4 w-4" />
                <span>Support</span>
              </Link>
              {user && (
                <Link href="/dashboard" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <span className="hidden sm:inline-block text-white/90">{user.name}</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:inline-block text-white/70 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Link href="/login">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : error || !article ? (
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Article Not Found</h2>
              <p className="text-white/70 mb-6">{error || 'The article you are looking for does not exist.'}</p>
              <Button
                onClick={() => router.push('/knowledge-base')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Knowledge Base
              </Button>

              {/* Article Header */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 md:p-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    {article.title}
                  </h1>
                  {article.summary && (
                    <p className="text-lg text-white/70 mb-6">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
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
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 md:p-8">
                  <MarkdownRenderer content={article.content} />
                </CardContent>
              </Card>

              {/* Bottom Navigation */}
              <div className="flex justify-center pt-6">
                <Button
                  onClick={() => router.push('/knowledge-base')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-4">
                innoZverse
              </div>
              <p className="text-white/60 text-sm">
                A comprehensive learning environment with detailed, ever-growing tutorials for individuals and companies.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/#features" className="text-white/60 hover:text-white transition-colors text-sm">Features</Link></li>
                <li><Link href="/pricing" className="text-white/60 hover:text-white transition-colors text-sm">Pricing</Link></li>
                <li><Link href="/knowledge-base" className="text-white/60 hover:text-white transition-colors text-sm">Knowledge Base</Link></li>
                <li><Link href="/#support" className="text-white/60 hover:text-white transition-colors text-sm">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/60 hover:text-white transition-colors text-sm">About Us</Link></li>
                <li><Link href="/privacy" className="text-white/60 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
            <p>&copy; {new Date().getFullYear()} innoZverse. All rights reserved.</p>
            <p className="mt-2">Developed with <a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">Claude Code</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
