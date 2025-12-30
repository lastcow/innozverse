'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, DollarSign, HeadphonesIcon, Shield, FileText, LayoutDashboard } from 'lucide-react';
import { ApiClient } from '@innozverse/api-client';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

export default function PrivacyPage() {
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-24">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="h-12 w-12 text-[#00D9FF]" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Privacy Policy
            </h1>
          </div>
          <p className="text-[#8B949E] text-lg">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Introduction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B949E] leading-relaxed">
                At innoZverse, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our learning platform and virtual machine services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Personal Information</h3>
                <p className="text-[#8B949E] leading-relaxed">
                  We collect personal information that you voluntarily provide to us when you register on the platform, such as your name, email address, and payment information. We also collect information when you use our virtual machines and learning resources.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Usage Data</h3>
                <p className="text-[#8B949E] leading-relaxed">
                  We automatically collect certain information when you visit, use, or navigate our platform. This information does not reveal your specific identity but may include device and usage information, such as IP address, browser characteristics, operating system, language preferences, referring URLs, and information about how you interact with our platform.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-white text-2xl">How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-[#8B949E]">
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>To provide, operate, and maintain our learning platform and services</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>To process your transactions and manage your subscriptions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>To improve, personalize, and expand our services</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>To communicate with you about updates, tutorials, and customer support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>To send you marketing and promotional communications (with your consent)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>To protect against fraudulent, unauthorized, or illegal activity</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Data Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B949E] leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures designed to protect your personal information. However, please note that no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
              <p className="text-[#8B949E] leading-relaxed">
                Your virtual machine sessions are isolated and secured. We do not monitor or access the content within your VMs unless required for technical support or security purposes with your explicit consent.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B949E] leading-relaxed">
                We will retain your personal information only for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law. When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize it.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B949E] leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="space-y-3 text-[#8B949E]">
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>The right to access and receive a copy of your personal information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>The right to request correction of inaccurate data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>The right to request deletion of your personal information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>The right to object to or restrict certain processing of your data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00D9FF] mr-2">•</span>
                  <span>The right to data portability</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B949E] leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B949E] leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#161B22] border-[#30363D]">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8B949E] leading-relaxed mb-4">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-[#21262D] rounded-lg p-4 border border-[#30363D]">
                <p className="text-[#8B949E]">
                  Email: <a href="mailto:privacy@innozverse.com" className="text-[#00D9FF] hover:text-[#33E1FF]">privacy@innozverse.com</a>
                </p>
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
