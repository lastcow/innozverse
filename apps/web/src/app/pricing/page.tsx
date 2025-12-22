'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, Monitor, Shield, Code, Clock, Sparkles, DollarSign, HeadphonesIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

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
              <Link href="/pricing" className="flex items-center gap-2 text-white hover:text-white transition-colors">
                <DollarSign className="h-4 w-4" />
                <span>Pricing</span>
              </Link>
              <Link href="/#support" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <HeadphonesIcon className="h-4 w-4" />
                <span>Support</span>
              </Link>
            </div>

            {/* CTA Button */}
            <div className="flex items-center space-x-4">
              <Link href="/login" className="hidden sm:inline-block text-white/70 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Access powerful virtual machines for hands-on learning in security and programming
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm rounded-full p-2 border border-white/10">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Yearly <span className="text-green-400 text-sm ml-1">(Save 17%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Free Plan */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-white text-2xl">Free</CardTitle>
              </div>
              <div className="text-4xl font-bold text-white mb-2">$0</div>
              <CardDescription className="text-white/70">
                Get started with basic access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-white/80 mb-6">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>1 VM remote access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Community support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Basic tutorials</span>
                </li>
              </ul>
              <Link href="/login">
                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Starter Security Plan */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-white text-2xl">Starter Security</CardTitle>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {billingCycle === 'monthly' ? '$15' : '$150'}
                <span className="text-lg font-normal text-white/60">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              <CardDescription className="text-white/70">
                Begin your security journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-white/80 mb-6">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>2 headless VMs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Kali Linux VM</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Linux VM</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Security tutorials</span>
                </li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Choose Plan
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Advanced Security Plan */}
          <Card className="bg-gradient-to-b from-purple-600/20 to-pink-600/20 border-purple-400/50 backdrop-blur-sm transform lg:scale-105 shadow-xl relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                MOST POPULAR
              </span>
            </div>
            <CardHeader className="pt-8">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-pink-400" />
                <CardTitle className="text-white text-2xl">Advanced Security</CardTitle>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {billingCycle === 'monthly' ? '$29' : '$290'}
                <span className="text-lg font-normal text-white/60">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              <CardDescription className="text-white/90">
                Complete security lab environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-white/90 mb-6">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>3 VMs with full access</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Kali Linux VM</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Linux VM</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Vulnerable Windows VM</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Advanced tutorials</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Choose Plan
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Programming Plan */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-white text-2xl">Programming</CardTitle>
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {billingCycle === 'monthly' ? '$25' : '$250'}
                <span className="text-lg font-normal text-white/60">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              <CardDescription className="text-white/70">
                Full-stack development environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-white/80 mb-6">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>2 development VMs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Linux + Database VM</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Linux + Claude Code VM</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Programming tutorials</span>
                </li>
              </ul>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Choose Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Guest Pass Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Clock className="h-6 w-6 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Guest Passes</h2>
            </div>
            <p className="text-white/70">Short-term access for temporary needs</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Remote 24h Pass */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Remote 24h Pass</CardTitle>
                <CardDescription className="text-white/70">
                  24-hour remote access to virtual machines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <span className="text-white">1 VM Access</span>
                    <span className="text-2xl font-bold text-white">$9</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <span className="text-white">2 VMs Access</span>
                    <span className="text-2xl font-bold text-white">$15</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-purple-400/50">
                    <span className="text-white">3 VMs Access</span>
                    <span className="text-2xl font-bold text-white">$22</span>
                  </div>
                </div>
                <Link href="/login" className="block mt-6">
                  <Button className="w-full" variant="outline">
                    Purchase Pass
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Onsite Day Pass */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Onsite Day Pass</CardTitle>
                <CardDescription className="text-white/70">
                  Optional in-person lab access for hands-on learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-400/30 text-center">
                    <p className="text-white/80 mb-3">Full day onsite access</p>
                    <p className="text-4xl font-bold text-white mb-2">$25 - $35</p>
                    <p className="text-sm text-white/60">Based on availability</p>
                  </div>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Physical lab access</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>On-site support</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Networking opportunities</span>
                    </li>
                  </ul>
                </div>
                <Link href="/login" className="block mt-6">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Contact Us
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-white/60">
            Need a custom plan for your organization?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 underline">
              Contact us
            </Link>
          </p>
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
