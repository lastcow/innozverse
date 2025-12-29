'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Monitor,
  Laptop,
  Gamepad2,
  Package,
  Users,
  Clock,
  Sparkles,
  DollarSign,
  HeadphonesIcon,
  GraduationCap,
  Building,
  Globe,
  Zap,
} from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semester'>('monthly');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Menu */}
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
              <Link href="/pricing" className="flex items-center gap-2 text-white hover:text-white transition-colors">
                <DollarSign className="h-4 w-4" />
                <span>Pricing</span>
              </Link>
              <Link href="/#support" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <HeadphonesIcon className="h-4 w-4" />
                <span>Support</span>
              </Link>
            </div>
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
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your learning journey. From free access to premium features, we have options for everyone.
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
              onClick={() => setBillingCycle('semester')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'semester'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Semester <span className="text-green-400 text-sm ml-1">(~35% off)</span>
            </button>
          </div>
          <p className="text-sm text-white/50 mt-2">Semester pricing available for students only</p>
        </div>

        {/* Section 1: VM Learning Environment */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Monitor className="h-8 w-8 text-purple-400" />
            <h2 className="text-3xl font-bold text-white">VM Learning Environment</h2>
          </div>
          <p className="text-white/70 mb-6">Proxmox-based Lab | Specs per VM: 8 Core, 2GB RAM, 32GB SSD</p>

          {/* Membership Tiers Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Free Tier */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-xl">Free</CardTitle>
                <div className="text-3xl font-bold text-white">$0</div>
                <CardDescription className="text-white/60 text-xs">Remote access only</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>1 VM (2 Core, 1GB RAM)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>20 hours/month max</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Community support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <span>No in-site access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Pay-As-You-Go */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-xl">Pay-As-You-Go</CardTitle>
                <div className="text-3xl font-bold text-white">$2<span className="text-lg font-normal text-white/60">/hour</span></div>
                <CardDescription className="text-white/60 text-xs">Remote + In-Site</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>2 VMs included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Full specs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>5 pages printing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Basic */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-xl">Basic</CardTitle>
                <div className="text-3xl font-bold text-white">
                  {billingCycle === 'monthly' ? '$19' : '$65'}
                  <span className="text-lg font-normal text-white/60">/{billingCycle === 'monthly' ? 'mo' : 'sem'}</span>
                </div>
                <CardDescription className="text-white/60 text-xs">10% equipment discount</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>2 VMs included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Interconnected lab</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Email support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>20 pages printing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Pro - Most Popular */}
            <Card className="bg-gradient-to-b from-purple-600/20 to-pink-600/20 border-purple-400/50 backdrop-blur-sm relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-white text-xl">Pro</CardTitle>
                <div className="text-3xl font-bold text-white">
                  {billingCycle === 'monthly' ? '$35' : '$119'}
                  <span className="text-lg font-normal text-white/60">/{billingCycle === 'monthly' ? 'mo' : 'sem'}</span>
                </div>
                <CardDescription className="text-white/60 text-xs">15% equipment discount</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>3 VMs included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Extended hours</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Snapshots included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>50 pages printing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-xl">Premium</CardTitle>
                <div className="text-3xl font-bold text-white">
                  {billingCycle === 'monthly' ? '$59' : '$199'}
                  <span className="text-lg font-normal text-white/60">/{billingCycle === 'monthly' ? 'mo' : 'sem'}</span>
                </div>
                <CardDescription className="text-white/60 text-xs">20% equipment discount</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>5 VMs included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>24/7 support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Custom configs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Unlimited snapshots</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Unlimited printing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Add-ons */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Add-ons</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white/80">Extra VM (beyond tier limit)</span>
                <span className="text-white font-semibold">$6/month</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white/80">Additional storage (32GB)</span>
                <span className="text-white font-semibold">$2/month</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white/80">Student discount (non-semester)</span>
                <span className="text-white font-semibold">15% off</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Quick Comparison Chart */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Zap className="h-8 w-8 text-yellow-400" />
            <h2 className="text-3xl font-bold text-white">Quick Comparison</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="py-4 px-4 text-white/70 font-medium">Feature</th>
                  <th className="py-4 px-4 text-white font-medium text-center">Free</th>
                  <th className="py-4 px-4 text-white font-medium text-center">Pay-As-You-Go</th>
                  <th className="py-4 px-4 text-white font-medium text-center">Basic</th>
                  <th className="py-4 px-4 text-white font-medium text-center bg-purple-600/20">Pro</th>
                  <th className="py-4 px-4 text-white font-medium text-center">Premium</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Price</td>
                  <td className="py-3 px-4 text-center">$0</td>
                  <td className="py-3 px-4 text-center">$2/hour</td>
                  <td className="py-3 px-4 text-center">$19/mo</td>
                  <td className="py-3 px-4 text-center bg-purple-600/10">$35/mo</td>
                  <td className="py-3 px-4 text-center">$59/mo</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">VMs</td>
                  <td className="py-3 px-4 text-center">1 (limited)</td>
                  <td className="py-3 px-4 text-center">2</td>
                  <td className="py-3 px-4 text-center">2</td>
                  <td className="py-3 px-4 text-center bg-purple-600/10">3</td>
                  <td className="py-3 px-4 text-center">5</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Remote Access</td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="py-3 px-4 text-center bg-purple-600/10"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">In-Site Access</td>
                  <td className="py-3 px-4 text-center"><XCircle className="h-5 w-5 text-red-400 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="py-3 px-4 text-center bg-purple-600/10"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                  <td className="py-3 px-4 text-center"><CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" /></td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Equipment Discount</td>
                  <td className="py-3 px-4 text-center">-</td>
                  <td className="py-3 px-4 text-center">-</td>
                  <td className="py-3 px-4 text-center">10%</td>
                  <td className="py-3 px-4 text-center bg-purple-600/10">15%</td>
                  <td className="py-3 px-4 text-center">20%</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4">Support</td>
                  <td className="py-3 px-4 text-center">Community</td>
                  <td className="py-3 px-4 text-center">Email</td>
                  <td className="py-3 px-4 text-center">Email</td>
                  <td className="py-3 px-4 text-center bg-purple-600/10">Email</td>
                  <td className="py-3 px-4 text-center">Email</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Semester Price</td>
                  <td className="py-3 px-4 text-center">-</td>
                  <td className="py-3 px-4 text-center">-</td>
                  <td className="py-3 px-4 text-center">$65</td>
                  <td className="py-3 px-4 text-center bg-purple-600/10">$119</td>
                  <td className="py-3 px-4 text-center">$199</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Equipment Leasing */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Laptop className="h-8 w-8 text-blue-400" />
            <h2 className="text-3xl font-bold text-white">Equipment Leasing</h2>
            <span className="text-sm text-white/50 bg-white/10 px-3 py-1 rounded-full">Local Only</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Laptops */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Laptop className="h-6 w-6 text-blue-400" />
                  <CardTitle className="text-white text-2xl">Laptops</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="py-2 text-white/70 font-medium">Type</th>
                        <th className="py-2 text-white/70 font-medium text-right">Weekly</th>
                        <th className="py-2 text-white/70 font-medium text-right">Monthly</th>
                        <th className="py-2 text-white/70 font-medium text-right">Deposit</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      <tr className="border-b border-white/10">
                        <td className="py-3">Used/Refurbished (Basic)</td>
                        <td className="py-3 text-right">$30</td>
                        <td className="py-3 text-right">$90</td>
                        <td className="py-3 text-right">$100</td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="py-3">New (Standard)</td>
                        <td className="py-3 text-right">$45</td>
                        <td className="py-3 text-right">$130</td>
                        <td className="py-3 text-right">$200</td>
                      </tr>
                      <tr>
                        <td className="py-3">Surface Pro/Laptop</td>
                        <td className="py-3 text-right">$75</td>
                        <td className="py-3 text-right">$220</td>
                        <td className="py-3 text-right">$350</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Xbox */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-6 w-6 text-green-400" />
                  <CardTitle className="text-white text-2xl">Xbox Consoles & Accessories</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="py-2 text-white/70 font-medium">Item</th>
                        <th className="py-2 text-white/70 font-medium text-right">Weekly</th>
                        <th className="py-2 text-white/70 font-medium text-right">Monthly</th>
                        <th className="py-2 text-white/70 font-medium text-right">Deposit</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      <tr className="border-b border-white/10">
                        <td className="py-3">Xbox Series S</td>
                        <td className="py-3 text-right">$18</td>
                        <td className="py-3 text-right">$55</td>
                        <td className="py-3 text-right">$100</td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="py-3">Xbox Series X</td>
                        <td className="py-3 text-right">$25</td>
                        <td className="py-3 text-right">$75</td>
                        <td className="py-3 text-right">$200</td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="py-3">Standard Controller</td>
                        <td className="py-3 text-right">$5</td>
                        <td className="py-3 text-right">$15</td>
                        <td className="py-3 text-right">$25</td>
                      </tr>
                      <tr>
                        <td className="py-3">Elite Controller</td>
                        <td className="py-3 text-right">$10</td>
                        <td className="py-3 text-right">$30</td>
                        <td className="py-3 text-right">$50</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leasing Terms */}
          <div className="mt-8 bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Leasing Terms</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-white/70">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Minimum rental: 1 week</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Credit card required for deposit</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Late fee: $15/day</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Damage protection (optional): 10% of rental</span>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <span>No refund for early return</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Microsoft Product Discounts */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Package className="h-8 w-8 text-orange-400" />
            <h2 className="text-3xl font-bold text-white">Microsoft Product Discounts</h2>
            <span className="text-sm text-white/50 bg-white/10 px-3 py-1 rounded-full">Sample Products</span>
            <span className="text-sm text-white/50 bg-white/10 px-3 py-1 rounded-full">Members Only</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white/5 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-white/10">
                  <th className="py-4 px-4 text-white font-medium">Product</th>
                  <th className="py-4 px-4 text-white/70 font-medium text-right">Retail</th>
                  <th className="py-4 px-4 text-white font-medium text-right">Basic (10%)</th>
                  <th className="py-4 px-4 text-white font-medium text-right">Pro (15%)</th>
                  <th className="py-4 px-4 text-white font-medium text-right">Premium (20%)</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-medium">Surface Pro</td>
                  <td className="py-3 px-4 text-right text-white/50">$999</td>
                  <td className="py-3 px-4 text-right">$899</td>
                  <td className="py-3 px-4 text-right">$849</td>
                  <td className="py-3 px-4 text-right text-green-400">$799</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-medium">Surface Laptop</td>
                  <td className="py-3 px-4 text-right text-white/50">$1,299</td>
                  <td className="py-3 px-4 text-right">$1,169</td>
                  <td className="py-3 px-4 text-right">$1,104</td>
                  <td className="py-3 px-4 text-right text-green-400">$1,039</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-medium">Xbox Series S</td>
                  <td className="py-3 px-4 text-right text-white/50">$299</td>
                  <td className="py-3 px-4 text-right">$269</td>
                  <td className="py-3 px-4 text-right">$254</td>
                  <td className="py-3 px-4 text-right text-green-400">$239</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-medium">Xbox Series X</td>
                  <td className="py-3 px-4 text-right text-white/50">$499</td>
                  <td className="py-3 px-4 text-right">$449</td>
                  <td className="py-3 px-4 text-right">$424</td>
                  <td className="py-3 px-4 text-right text-green-400">$399</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 px-4 font-medium">Standard Controller</td>
                  <td className="py-3 px-4 text-right text-white/50">$59</td>
                  <td className="py-3 px-4 text-right">$53</td>
                  <td className="py-3 px-4 text-right">$50</td>
                  <td className="py-3 px-4 text-right text-green-400">$47</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Elite Controller</td>
                  <td className="py-3 px-4 text-right text-white/50">$179</td>
                  <td className="py-3 px-4 text-right">$161</td>
                  <td className="py-3 px-4 text-right">$152</td>
                  <td className="py-3 px-4 text-right text-green-400">$143</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Bundle Deals */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="h-8 w-8 text-pink-400" />
            <h2 className="text-3xl font-bold text-white">Bundle Deals</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-6 w-6 text-blue-400" />
                  <CardTitle className="text-white text-xl">Student Starter</CardTitle>
                </div>
                <div className="text-3xl font-bold text-white">$139</div>
                <CardDescription className="text-green-400">~15% savings</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Basic membership (semester)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Laptop rental (1 month)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-teal-600/20 border-green-400/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Gamepad2 className="h-6 w-6 text-green-400" />
                  <CardTitle className="text-white text-xl">Pro Gamer</CardTitle>
                </div>
                <div className="text-3xl font-bold text-white">$99</div>
                <CardDescription className="text-green-400">~10% savings</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Pro membership (1 month)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Xbox Series X rental (1 month)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-400/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-6 w-6 text-purple-400" />
                  <CardTitle className="text-white text-xl">Full Lab</CardTitle>
                </div>
                <div className="text-3xl font-bold text-white">$249</div>
                <CardDescription className="text-green-400">~10% savings</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Premium membership (1 month)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>Surface Pro rental (1 month)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 6: Value Comparison */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-8 w-8 text-cyan-400" />
            <h2 className="text-3xl font-bold text-white">Pay-As-You-Go vs Subscription</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Monthly Comparison */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-xl">Monthly Comparison (vs Pro $35/mo)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">5 hours/month</span>
                    <span className="text-white">$10 <span className="text-green-400 text-sm">- Pay-As-You-Go wins</span></span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">10 hours/month</span>
                    <span className="text-white">$20 <span className="text-green-400 text-sm">- Pay-As-You-Go wins</span></span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                    <span className="text-white font-medium">~18 hours/month</span>
                    <span className="text-yellow-400 font-medium">Break-even point</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">25 hours/month</span>
                    <span className="text-white">$50 <span className="text-purple-400 text-sm">- Pro wins</span></span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70">40 hours/month</span>
                    <span className="text-white">$80 <span className="text-purple-400 text-sm">- Pro wins</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Semester Savings */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-xl">Semester Savings (4 months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">Basic</span>
                      <span className="text-green-400 font-semibold">Save $11 (14%)</span>
                    </div>
                    <div className="text-white/60 text-sm">$76 monthly vs $65 semester</div>
                  </div>
                  <div className="p-4 bg-purple-600/20 border border-purple-400/30 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">Pro</span>
                      <span className="text-green-400 font-semibold">Save $21 (15%)</span>
                    </div>
                    <div className="text-white/60 text-sm">$140 monthly vs $119 semester</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">Premium</span>
                      <span className="text-green-400 font-semibold">Save $37 (16%)</span>
                    </div>
                    <div className="text-white/60 text-sm">$236 monthly vs $199 semester</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 7: Target Markets */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Users className="h-8 w-8 text-indigo-400" />
            <h2 className="text-3xl font-bold text-white">Find Your Perfect Plan</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-blue-400" />
                  <CardTitle className="text-white">Students (Local)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-white/70 text-sm">
                <p className="mb-3">Semester VM plans, laptop leasing, equipment discounts</p>
                <p className="text-white/50">Remote + In-Site | Semester tiers $65-199</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-6 w-6 text-green-400" />
                  <CardTitle className="text-white">Students (Global)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-white/70 text-sm">
                <p className="mb-3">Monthly/semester VM plans for remote learning</p>
                <p className="text-white/50">Remote only | Monthly $19-59, Semester $65-199</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="h-6 w-6 text-purple-400" />
                  <CardTitle className="text-white">Professionals (Local)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-white/70 text-sm">
                <p className="mb-3">Monthly VM plans, Surface leasing, in-site workspace</p>
                <p className="text-white/50">Remote + In-Site | Pro/Premium $35-59/month</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-6 w-6 text-orange-400" />
                  <CardTitle className="text-white">Professionals (Global)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-white/70 text-sm">
                <p className="mb-3">Monthly VM plans for remote development</p>
                <p className="text-white/50">Remote only | Pro/Premium $35-59/month</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-6 w-6 text-pink-400" />
                  <CardTitle className="text-white">General Consumers</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-white/70 text-sm">
                <p className="mb-3">Equipment leasing, Xbox rental</p>
                <p className="text-white/50">In-Site pickup | Weekly $18-75, Monthly $55-220</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-cyan-400" />
                  <CardTitle className="text-white">Casual Users</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-white/70 text-sm">
                <p className="mb-3">Pay-as-you-go or Free tier for occasional use</p>
                <p className="text-white/50">Remote (+ In-Site) | $2/hour or Free</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Join thousands of learners and professionals using our VM learning environment.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Contact Sales
              </Button>
            </Link>
          </div>
          <p className="text-white/50 mt-6 text-sm">
            Need a custom plan for your organization? Contact us for enterprise pricing.
          </p>
        </section>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
