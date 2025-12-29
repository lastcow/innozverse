'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, DollarSign, HeadphonesIcon, Shield, Code, Brain, Rocket, Users, Target, FileText, LayoutDashboard } from 'lucide-react';
import { ApiClient } from '@innozverse/api-client';

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
);

export default function AboutPage() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (!refreshToken) {
          setIsLoading(false);
          return;
        }
        await apiClient.refresh();
        const response = await apiClient.getMe();
        setUser({ name: response.data.user.name });
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Menu */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                innoZverse
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <Sparkles className="h-4 w-4" />
                <span>Features</span>
              </Link>
              <Link href="/pricing" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <DollarSign className="h-4 w-4" />
                <span>Pricing</span>
              </Link>
              <Link href="/knowledge-base" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <FileText className="h-4 w-4" />
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

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-white/20 animate-pulse" />
              ) : user ? (
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About innoZverse
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Empowering the next generation of tech professionals through hands-on learning
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-8 w-8 text-purple-400" />
                <CardTitle className="text-white text-3xl">Our Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 text-lg leading-relaxed mb-4">
                At innoZverse, we believe that hands-on experience is the key to mastering technology. Our mission is to provide a comprehensive learning environment where individuals and companies can develop cutting-edge skills through practical, real-world scenarios.
              </p>
              <p className="text-white/80 text-lg leading-relaxed">
                We offer access to virtual machines and detailed tutorials across security, programming, artificial intelligence, and emerging technologies. Our platform is designed to bridge the gap between theoretical knowledge and practical application, ensuring learners gain the confidence and expertise needed to excel in today&apos;s rapidly evolving tech landscape.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What We Offer */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">What We Offer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <Shield className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle className="text-white">Security Training</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 text-sm">
                  Master cybersecurity with hands-on labs featuring Kali Linux, vulnerable systems, and real-world attack scenarios.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <Code className="h-12 w-12 text-pink-400 mb-4" />
                <CardTitle className="text-white">Programming Labs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 text-sm">
                  Build real applications with our development VMs equipped with databases, Claude Code, and modern tooling.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <Brain className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle className="text-white">AI & Machine Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 text-sm">
                  Explore artificial intelligence through practical projects and comprehensive tutorials on the latest AI technologies.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <Rocket className="h-12 w-12 text-green-400 mb-4" />
                <CardTitle className="text-white">Emerging Tech</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 text-sm">
                  Stay ahead with blockchain, quantum computing, and next-generation technologies through guided learning paths.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Who We Serve */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">Who We Serve</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-6 w-6 text-purple-400" />
                  <CardTitle className="text-white text-2xl">Individuals</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 leading-relaxed">
                  Whether you&apos;re a student, career changer, or professional looking to upskill, our platform provides the resources and environment you need to master new technologies at your own pace.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-6 w-6 text-pink-400" />
                  <CardTitle className="text-white text-2xl">Companies</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 leading-relaxed">
                  Train your teams with custom learning paths, dedicated support, and comprehensive analytics. Our enterprise solutions help organizations stay competitive in the digital age.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-b from-purple-600/20 to-pink-600/20 border-purple-400/50 backdrop-blur-sm">
            <CardContent className="pt-12 pb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of learners advancing their careers with innoZverse
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/login">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Get Started
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/50 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="col-span-2">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-4">
                innoZverse
              </div>
              <p className="text-white/60 text-sm">
                A comprehensive learning environment with detailed, ever-growing tutorials for individuals and companies.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/#features" className="text-white/60 hover:text-white transition-colors text-sm">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-white/60 hover:text-white transition-colors text-sm">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/#support" className="text-white/60 hover:text-white transition-colors text-sm">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-white/60 hover:text-white transition-colors text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-white/60 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
            <p>&copy; {new Date().getFullYear()} innoZverse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
