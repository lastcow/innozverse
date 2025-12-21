'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by checking for access token
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('refresh_token');

    if (hasToken) {
      // Redirect to dashboard if logged in
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500">
      <div className="max-w-2xl mx-auto text-center px-4">
        <h1 className="text-6xl font-bold text-white mb-6">
          innozverse
        </h1>
        <p className="text-xl text-white/90 mb-8">
          Welcome to the future of innovation. Sign in to access your dashboard and explore endless possibilities.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg bg-white/10 text-white border-white/20 hover:bg-white/20">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
