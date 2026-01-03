'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Monitor, Laptop, Gamepad2, FileText, Users, CheckCircle2, XCircle, Sparkles, DollarSign, HeadphonesIcon, LayoutDashboard, Package } from 'lucide-react';
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
            VM Learning Environment & Equipment Leasing
          </p>
          <p className="text-lg text-[#8B949E] mb-6 max-w-2xl mx-auto">
            Access Proxmox-based labs, lease laptops and gaming equipment, and explore our free Knowledge Base for security, programming, and emerging technology tutorials.
          </p>
          {/* Free Knowledge Base Highlight */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-3 bg-[#3DDC97]/10 border border-[#3DDC97]/30 rounded-full px-6 py-3">
              <FileText className="h-5 w-5 text-[#3DDC97]" />
              <span className="text-[#3DDC97] font-medium">All Knowledge Base articles are FREE to access!</span>
            </div>
          </div>
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
            <p className="text-xl text-[#8B949E]">VM labs, equipment leasing, and free learning resources</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#00D9FF] transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]">
              <CardHeader>
                <Monitor className="h-12 w-12 text-[#00D9FF] mb-4" />
                <CardTitle className="text-white">VM Learning Labs</CardTitle>
                <CardDescription className="text-[#8B949E]">
                  Proxmox-based virtual machines with 8 Core, 2GB RAM, 32GB SSD specs. Remote and in-site access available.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#3DDC97] transition-all hover:shadow-[0_0_20px_rgba(61,220,151,0.15)]">
              <CardHeader>
                <Laptop className="h-12 w-12 text-[#3DDC97] mb-4" />
                <CardTitle className="text-white">Laptop Leasing</CardTitle>
                <CardDescription className="text-[#8B949E]">
                  Rent refurbished laptops, new devices, or Surface Pro/Laptop for weekly or monthly terms.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#00D9FF] transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]">
              <CardHeader>
                <Gamepad2 className="h-12 w-12 text-[#00D9FF] mb-4" />
                <CardTitle className="text-white">Gaming Equipment</CardTitle>
                <CardDescription className="text-[#8B949E]">
                  Xbox Series S/X consoles and controllers available for rent with flexible leasing terms.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#3DDC97] transition-all hover:shadow-[0_0_20px_rgba(61,220,151,0.15)]">
              <CardHeader>
                <FileText className="h-12 w-12 text-[#3DDC97] mb-4" />
                <CardTitle className="text-white">Free Knowledge Base</CardTitle>
                <CardDescription className="text-[#8B949E]">
                  Access detailed tutorials on security, programming, AI, and emerging tech at no cost.
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
            <h2 className="text-4xl font-bold text-white mb-4">VM Learning Environment Plans</h2>
            <p className="text-xl text-[#8B949E] mb-4">Flexible pricing for every learner - from free to premium</p>
            <p className="text-sm text-[#484F58]">Specs per VM: 8 Core, 2GB RAM, 32GB SSD</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Tier */}
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#484F58] transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-2xl">Free</CardTitle>
                <div className="text-3xl font-bold text-white">$0</div>
                <CardDescription className="text-[#484F58] text-sm">Remote access only</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-[#8B949E] text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>1 VM (2 Core, 1GB RAM)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>20 hours/month max</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>Community support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-[#F85149] flex-shrink-0" />
                    <span>No in-site access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Basic Tier */}
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#484F58] transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-2xl">Basic</CardTitle>
                <div className="text-3xl font-bold text-white">$19<span className="text-lg font-normal text-[#484F58]">/mo</span></div>
                <CardDescription className="text-[#484F58] text-sm">10% equipment discount</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-[#8B949E] text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>2 VMs included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>Interconnected lab</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>In-site access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Pro Tier - Most Popular */}
            <Card className="bg-[#21262D] border-[#00D9FF] shadow-[0_0_20px_rgba(0,217,255,0.3)] relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] text-[#0D1117] text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-white text-2xl">Pro</CardTitle>
                <div className="text-3xl font-bold text-white">$30<span className="text-lg font-normal text-[#484F58]">/mo</span></div>
                <CardDescription className="text-[#484F58] text-sm">15% equipment discount</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>3 VMs included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>Custom configs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>In-site access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Premium Tier */}
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#484F58] transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-2xl">Premium</CardTitle>
                <div className="text-3xl font-bold text-white">$55<span className="text-lg font-normal text-[#484F58]">/mo</span></div>
                <CardDescription className="text-[#484F58] text-sm">20% equipment discount</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-[#8B949E] text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>5 VMs included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>Custom configs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                    <span>In-site access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Semester Discount Note */}
          <div className="text-center mt-8 mb-12">
            <div className="inline-flex items-center gap-2 bg-[#3DDC97]/10 border border-[#3DDC97]/30 rounded-lg px-4 py-2">
              <Package className="h-5 w-5 text-[#3DDC97]" />
              <span className="text-[#3DDC97] font-medium">Students save ~35% with semester pricing!</span>
            </div>
          </div>

          <div className="text-center">
            <Link href="/pricing">
              <Button size="lg" className="text-lg bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all">
                View Full Pricing & Equipment Leasing
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
                Whether you need help with your VM setup, have questions about equipment leasing, or want to explore our Knowledge Base, our support team is ready to assist.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Users className="h-6 w-6 text-[#00D9FF] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Community Support</h3>
                    <p className="text-[#8B949E]">Free tier users get access to our community forums for peer support</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <HeadphonesIcon className="h-6 w-6 text-[#3DDC97] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Email Support</h3>
                    <p className="text-[#8B949E]">Paid members get dedicated email support for technical issues</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="h-6 w-6 text-[#3DDC97] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Free Knowledge Base</h3>
                    <p className="text-[#8B949E]">Self-service tutorials and guides available to everyone at no cost</p>
                  </div>
                </div>
              </div>
            </div>
            <Card className="bg-[#161B22] border-[#30363D]">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Ready to Get Started?</CardTitle>
                <CardDescription className="text-[#8B949E] text-base">
                  Join learners and professionals using our VM labs and equipment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button size="lg" className="w-full text-lg bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all">
                    Get Started Free
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
                VM learning environment, equipment leasing, and free Knowledge Base for students, professionals, and enthusiasts.
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
