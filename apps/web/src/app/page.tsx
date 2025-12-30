'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Shield, Code, Brain, Rocket, Users, CheckCircle2, BookOpen, Sparkles, DollarSign, HeadphonesIcon, LayoutDashboard, FileText } from 'lucide-react';
import { TechBackground } from '@/components/TechBackground';
import { UserMenu } from '@/components/layout/user-menu';
import { ApiClient } from '@innozverse/api-client';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

export default function Home() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const refreshToken = apiClient.getRefreshToken();
        if (!refreshToken) {
          setIsLoading(false);
          return;
        }

        // Try to refresh the token and get user info
        await apiClient.refresh();
        const response = await apiClient.getMe();
        setUser({
          name: response.data.user.name,
          email: response.data.user.email,
        });
      } catch {
        // User is not logged in or token is invalid
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Navigation Menu */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#161B22]/90 backdrop-blur-md border-b border-[#30363D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] to-[#3DDC97]">
                innoZverse
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="flex items-center gap-2 text-[#8B949E] hover:text-white transition-colors">
                <Sparkles className="h-4 w-4" />
                <span>Features</span>
              </Link>
              <Link href="/pricing" className="flex items-center gap-2 text-[#8B949E] hover:text-white transition-colors">
                <DollarSign className="h-4 w-4" />
                <span>Pricing</span>
              </Link>
              <Link href="/knowledge-base" className="flex items-center gap-2 text-[#8B949E] hover:text-white transition-colors">
                <FileText className="h-4 w-4" />
                <span>Knowledge Base</span>
              </Link>
              <Link href="#support" className="flex items-center gap-2 text-[#8B949E] hover:text-white transition-colors">
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

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-[#21262D] animate-pulse" />
              ) : user ? (
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

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center pt-16">
        {/* D3.js Interactive Background */}
        <div className="absolute inset-0 bg-[#0D1117]">
          <TechBackground />
        </div>

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117]/60 via-[#0D1117]/40 to-[#0D1117]/80" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center w-full">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] via-[#3DDC97] to-[#00D9FF]">
            innoZverse
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
            Your Gateway to Cutting-Edge Technology Learning
          </p>
          <p className="text-lg text-[#8B949E] mb-10 max-w-2xl mx-auto">
            A comprehensive learning environment with detailed, ever-growing tutorials for individuals and companies mastering security, programming, AI, and emerging technologies.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login">
              <Button size="lg" className="text-lg bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg bg-transparent text-[#00D9FF] border-[#00D9FF] hover:bg-[#00D9FF]/10">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">What We Offer</h2>
            <p className="text-xl text-[#8B949E]">Comprehensive learning paths across critical technology domains</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#00D9FF] transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]">
              <CardHeader>
                <Shield className="h-12 w-12 text-[#00D9FF] mb-4" />
                <CardTitle className="text-white">Security</CardTitle>
                <CardDescription className="text-[#8B949E]">
                  Master cybersecurity fundamentals, ethical hacking, and advanced defense strategies
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#3DDC97] transition-all hover:shadow-[0_0_20px_rgba(61,220,151,0.15)]">
              <CardHeader>
                <Code className="h-12 w-12 text-[#3DDC97] mb-4" />
                <CardTitle className="text-white">Programming</CardTitle>
                <CardDescription className="text-[#8B949E]">
                  Learn modern programming languages, frameworks, and software development best practices
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#00D9FF] transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]">
              <CardHeader>
                <Brain className="h-12 w-12 text-[#00D9FF] mb-4" />
                <CardTitle className="text-white">Artificial Intelligence</CardTitle>
                <CardDescription className="text-[#8B949E]">
                  Explore machine learning, deep learning, and practical AI implementation techniques
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#3DDC97] transition-all hover:shadow-[0_0_20px_rgba(61,220,151,0.15)]">
              <CardHeader>
                <Rocket className="h-12 w-12 text-[#3DDC97] mb-4" />
                <CardTitle className="text-white">Emerging Tech</CardTitle>
                <CardDescription className="text-[#8B949E]">
                  Stay ahead with blockchain, quantum computing, and next-generation technologies
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Subscription Tiers Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-[#161B22]/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Choose Your Learning Path</h2>
            <p className="text-xl text-[#8B949E]">Flexible subscription plans tailored to your learning journey</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#484F58] transition-all">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Beginner</CardTitle>
                <CardDescription className="text-[#8B949E] text-lg">
                  Start your tech journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-[#8B949E]">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Access to foundational tutorials</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Community forum access</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Monthly live Q&A sessions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Certificate of completion</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-[#21262D] border-[#00D9FF] shadow-[0_0_20px_rgba(0,217,255,0.3)] transform md:scale-105">
              <CardHeader>
                <div className="inline-block px-3 py-1 bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] text-[#0D1117] text-xs font-bold rounded-full mb-2">
                  MOST POPULAR
                </div>
                <CardTitle className="text-white text-2xl">Professional</CardTitle>
                <CardDescription className="text-white/80 text-lg">
                  Accelerate your expertise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Everything in Beginner</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Advanced tutorials and projects</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>1-on-1 mentorship sessions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Hands-on lab environments</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#484F58] transition-all">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Enterprise</CardTitle>
                <CardDescription className="text-[#8B949E] text-lg">
                  For teams and organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-[#8B949E]">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Everything in Professional</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Custom learning paths</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>Team analytics dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mr-2 mt-0.5 flex-shrink-0" />
                    <span>On-site training options</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-12">
            <Link href="/pricing">
              <Button size="lg" className="text-lg bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all">
                View All Pricing Options
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">We&apos;re Here to Help</h2>
              <p className="text-lg text-[#8B949E] mb-6">
                Our expert support team is dedicated to ensuring your success. Whether you&apos;re stuck on a concept, need guidance on your learning path, or require technical assistance, we&apos;re here for you.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Users className="h-6 w-6 text-[#00D9FF] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Expert Mentorship</h3>
                    <p className="text-[#8B949E]">Connect with industry professionals who guide your learning journey</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <BookOpen className="h-6 w-6 text-[#3DDC97] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Comprehensive Resources</h3>
                    <p className="text-[#8B949E]">Access detailed documentation, video tutorials, and practical examples</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-[#3DDC97] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">24/7 Community Support</h3>
                    <p className="text-[#8B949E]">Join a vibrant community of learners helping each other succeed</p>
                  </div>
                </div>
              </div>
            </div>
            <Card className="bg-[#161B22] border-[#30363D]">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Ready to Transform Your Skills?</CardTitle>
                <CardDescription className="text-[#8B949E] text-base">
                  Join thousands of learners advancing their careers with innozverse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button size="lg" className="w-full text-lg bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all">
                    Start Learning Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-center text-[#484F58] text-sm mt-4">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#00D9FF] hover:text-[#33E1FF] underline">
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#30363D] py-12 px-4 sm:px-6 lg:px-8 bg-[#161B22]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="col-span-2">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] mb-4">
                innoZverse
              </div>
              <p className="text-[#8B949E] text-sm">
                A comprehensive learning environment with detailed, ever-growing tutorials for individuals and companies.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#features" className="text-[#8B949E] hover:text-white transition-colors text-sm">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-[#8B949E] hover:text-white transition-colors text-sm">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/knowledge-base" className="text-[#8B949E] hover:text-white transition-colors text-sm">
                    Knowledge Base
                  </Link>
                </li>
                <li>
                  <Link href="#support" className="text-[#8B949E] hover:text-white transition-colors text-sm">
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
                  <Link href="/about" className="text-[#8B949E] hover:text-white transition-colors text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-[#8B949E] hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#30363D] pt-8 text-center text-[#8B949E] text-sm">
            <p>&copy; {new Date().getFullYear()} innoZverse. All rights reserved.</p>
            <p className="mt-2">Developed with <a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer" className="text-[#00D9FF] hover:text-[#33E1FF]">Claude Code</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
