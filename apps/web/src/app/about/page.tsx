'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, DollarSign, HeadphonesIcon, Shield, Users, Target, FileText, LayoutDashboard, Monitor, Laptop, GraduationCap, MapPin, Wifi, Package } from 'lucide-react';
import { ApiClient } from '@innozverse/api-client';

const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.innozverse.com'
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
              <Link href="/#features" className="flex items-center gap-2 text-[#8B949E] hover:text-white transition-colors">
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

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-[#21262D] animate-pulse" />
              ) : user ? (
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About innoZverse
          </h1>
          <p className="text-xl text-[#8B949E] max-w-3xl mx-auto">
            Your complete learning partner - providing environments, equipment, and support for students
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-8 w-8 text-[#00D9FF]" />
                <CardTitle className="text-white text-3xl">Our Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B949E] text-lg leading-relaxed mb-4">
                At innoZverse, we&apos;re dedicated to making quality tech education accessible to everyone. We provide comprehensive learning environments - both on-site workspaces and remote virtual labs - so students can learn and practice wherever they are.
              </p>
              <p className="text-[#8B949E] text-lg leading-relaxed">
                Beyond learning environments, we help students get the equipment they need at prices they can afford. Through our equipment leasing programs and discounted sales, we ensure that financial barriers don&apos;t stand in the way of education.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What We Offer */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">What We Offer</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#00D9FF] transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]">
              <CardHeader>
                <MapPin className="h-12 w-12 text-[#00D9FF] mb-4" />
                <CardTitle className="text-white">On-Site Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B949E] text-sm">
                  Access our physical workspace locations equipped with high-performance computers, networking labs, and collaborative spaces for hands-on learning.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#3DDC97] transition-all hover:shadow-[0_0_20px_rgba(61,220,151,0.15)]">
              <CardHeader>
                <Wifi className="h-12 w-12 text-[#3DDC97] mb-4" />
                <CardTitle className="text-white">Remote VM Labs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B949E] text-sm">
                  Learn from anywhere with our cloud-based virtual machines. Get full access to development environments, security labs, and more from your own device.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#00D9FF] transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]">
              <CardHeader>
                <Laptop className="h-12 w-12 text-[#00D9FF] mb-4" />
                <CardTitle className="text-white">Equipment Leasing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B949E] text-sm">
                  Need a laptop or gaming console? Lease quality equipment at affordable monthly rates. Perfect for students who need hardware without the upfront cost.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#3DDC97] transition-all hover:shadow-[0_0_20px_rgba(61,220,151,0.15)]">
              <CardHeader>
                <Package className="h-12 w-12 text-[#3DDC97] mb-4" />
                <CardTitle className="text-white">Discounted Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B949E] text-sm">
                  Members get exclusive discounts on Microsoft products, gaming consoles, and accessories. Save 10-20% on equipment you need for learning.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#FF9F1C] transition-all hover:shadow-[0_0_20px_rgba(255,159,28,0.15)]">
              <CardHeader>
                <Monitor className="h-12 w-12 text-[#FF9F1C] mb-4" />
                <CardTitle className="text-white">Free Knowledge Base</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B949E] text-sm">
                  Access our comprehensive tutorials and documentation completely free. Learn at your own pace with guides covering security, programming, and more.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#161B22] border-[#30363D] hover:border-[#00D9FF] transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.15)]">
              <CardHeader>
                <Shield className="h-12 w-12 text-[#00D9FF] mb-4" />
                <CardTitle className="text-white">Student Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B949E] text-sm">
                  Dedicated email support for all members. Get help with technical questions, account issues, or guidance on your learning path.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Who We Serve */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">Who We Serve</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#161B22] border-[#30363D]">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="h-6 w-6 text-[#00D9FF]" />
                  <CardTitle className="text-white text-2xl">Students</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B949E] leading-relaxed">
                  Whether you&apos;re in high school, college, or pursuing certifications, we offer semester pricing with 35% savings and affordable equipment options to support your education.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#161B22] border-[#30363D]">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-6 w-6 text-[#3DDC97]" />
                  <CardTitle className="text-white text-2xl">Career Changers</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B949E] leading-relaxed">
                  Looking to break into tech? Our flexible monthly plans and comprehensive learning resources help you build practical skills at your own pace.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#161B22] border-[#30363D]">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-6 w-6 text-[#00D9FF]" />
                  <CardTitle className="text-white text-2xl">Remote Learners</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[#8B949E] leading-relaxed">
                  Can&apos;t make it to a physical location? Access the same powerful VM environments from anywhere with our remote learning options.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-[#00D9FF]/10 border-[#00D9FF]/30">
            <CardContent className="pt-12 pb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-[#8B949E] mb-8 max-w-2xl mx-auto">
                Join innoZverse today and get access to learning environments, equipment deals, and free educational resources
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/login">
                  <Button size="lg" className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all">
                    Get Started
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="bg-transparent text-[#00D9FF] border-[#00D9FF] hover:bg-[#00D9FF]/10">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#30363D] py-12 px-4 sm:px-6 lg:px-8 bg-[#161B22]/50 mt-16">
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
                  <Link href="/#features" className="text-[#8B949E] hover:text-white transition-colors text-sm">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-[#8B949E] hover:text-white transition-colors text-sm">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/#support" className="text-[#8B949E] hover:text-white transition-colors text-sm">
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
