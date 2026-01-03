'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Monitor,
  Cpu,
  HardDrive,
  Zap,
  Shield,
  RefreshCw,
  Sparkles,
  DollarSign,
  HeadphonesIcon,
  FileText,
  LayoutDashboard,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Star,
  Quote,
  Package,
  Wrench,
  Ban,
  Calendar,
} from 'lucide-react';
import { ApiClient } from '@innozverse/api-client';
import { UserMenu } from '@/components/layout/user-menu';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

// Subscription tiers data
const subscriptionTiers = [
  {
    id: 'flex-lite',
    name: 'Flex Lite',
    price: 49,
    description: 'Perfect for basic tasks and everyday computing',
    performance: '1080p Productivity',
    specs: {
      cpu: 'Intel Core i3-12100',
      ram: '8GB DDR4',
      storage: '256GB SSD',
      gpu: 'Intel UHD Graphics',
    },
    features: [
      'Web browsing & office work',
      'Video streaming',
      'Light multitasking',
      'Free shipping both ways',
      'Basic support',
    ],
    color: 'cyan',
    popular: false,
  },
  {
    id: 'flex-standard',
    name: 'Flex Standard',
    price: 89,
    description: 'Ideal for creative work and moderate gaming',
    performance: '1080p Creative & Gaming',
    specs: {
      cpu: 'Intel Core i5-13400F',
      ram: '16GB DDR4',
      storage: '512GB NVMe SSD',
      gpu: 'NVIDIA RTX 3060',
    },
    features: [
      'Photo & video editing',
      '1080p gaming at 60+ FPS',
      'Software development',
      'Priority shipping',
      'Email support',
    ],
    color: 'green',
    popular: true,
  },
  {
    id: 'flex-pro',
    name: 'Flex Pro',
    price: 149,
    description: 'Built for demanding workloads and serious gaming',
    performance: '1440p Gaming & Creative',
    specs: {
      cpu: 'AMD Ryzen 7 7700X',
      ram: '32GB DDR5',
      storage: '1TB NVMe SSD',
      gpu: 'NVIDIA RTX 4070',
    },
    features: [
      '1440p gaming at 120+ FPS',
      '4K video editing',
      '3D rendering & CAD',
      'Express shipping',
      'Priority support',
    ],
    color: 'orange',
    popular: false,
  },
];

// Value propositions
const valueProps = [
  {
    icon: Ban,
    title: 'No Long-Term Commitment',
    description: 'Month-to-month flexibility. Cancel anytime with no penalties or hidden fees.',
  },
  {
    icon: RefreshCw,
    title: 'Upgrade Anytime',
    description: 'Need more power? Swap to a higher tier whenever you want, no questions asked.',
  },
  {
    icon: Shield,
    title: 'Always Covered',
    description: 'Full warranty coverage included. If something breaks, we replace it fast.',
  },
  {
    icon: Package,
    title: 'Free Shipping',
    description: 'We ship your PC to you for free, and returns are on us too.',
  },
  {
    icon: Wrench,
    title: 'Latest Hardware',
    description: 'Get access to modern, well-maintained hardware without the upfront cost.',
  },
  {
    icon: Zap,
    title: 'Ready to Use',
    description: 'Pre-configured and tested. Just plug in and start using immediately.',
  },
];

// Testimonials
const testimonials = [
  {
    name: 'Alex M.',
    role: 'Freelance Developer',
    content: 'Perfect for my contract work. I needed a powerful machine for a 3-month project without buying one. Flex Standard handled everything I threw at it.',
    rating: 5,
  },
  {
    name: 'Sarah K.',
    role: 'Design Student',
    content: 'As a student, buying a high-end PC wasn\'t an option. The subscription lets me use professional tools for my coursework at a fraction of the cost.',
    rating: 5,
  },
  {
    name: 'Marcus T.',
    role: 'Content Creator',
    content: 'I upgraded from Lite to Pro mid-month with zero hassle. The flexibility is unmatched. My videos render so much faster now.',
    rating: 5,
  },
];

// FAQ items
const faqItems = [
  {
    question: 'How does the subscription work?',
    answer: 'Choose your tier, and we ship a pre-configured PC to your door. Pay monthly for as long as you need it. When you\'re done, ship it back for free. It\'s that simple.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes! There are no long-term contracts. Cancel your subscription at any time with no penalties. Just return the equipment and your subscription ends.',
  },
  {
    question: 'What happens if the PC breaks?',
    answer: 'All subscriptions include full warranty coverage. If anything goes wrong due to normal use, we\'ll replace the faulty component or send you a new system, usually within 2-3 business days.',
  },
  {
    question: 'Can I upgrade or downgrade my tier?',
    answer: 'Absolutely! You can change your tier at any time. We\'ll ship you the new system and provide a prepaid label to return your current one. The price difference is prorated.',
  },
  {
    question: 'What\'s included with the PC?',
    answer: 'Each subscription includes the complete desktop PC, power cable, and all necessary accessories. Peripherals (monitor, keyboard, mouse) are not included but can be added as optional add-ons.',
  },
  {
    question: 'Is there a minimum commitment?',
    answer: 'The minimum subscription period is 1 month. After that, you can continue month-to-month or return the equipment whenever you\'re ready.',
  },
  {
    question: 'How long does shipping take?',
    answer: 'Standard shipping is 5-7 business days. Priority shipping (included with Standard tier) is 3-5 days. Express shipping (included with Pro tier) is 1-2 business days.',
  },
  {
    question: 'What if I want to keep the PC?',
    answer: 'After 12 months of continuous subscription, you have the option to purchase the PC at a significantly reduced price. Contact our team for buyout pricing.',
  },
];

export default function SubscriptionPage() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Navigation Menu */}
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
              <Link href="/subscription" className="flex items-center gap-2 text-white hover:text-white transition-colors">
                <Monitor className="h-4 w-4" />
                <span>Rent a PC</span>
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
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#00D9FF]/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#00D9FF]/10 border border-[#00D9FF]/30 rounded-full px-4 py-2 mb-6">
            <Zap className="h-4 w-4 text-[#00D9FF]" />
            <span className="text-[#00D9FF] text-sm font-medium">Flex PC Subscription</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Get the Performance.
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] to-[#3DDC97]">
              Skip the Commitment.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#8B949E] max-w-3xl mx-auto mb-10">
            Month-to-month access to a powerful PC. No upfront costs, no long-term contracts.
            Just the hardware you need, when you need it.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="#tiers">
              <Button size="lg" className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all text-lg px-8">
                View Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="bg-transparent text-[#00D9FF] border-[#00D9FF] hover:bg-[#00D9FF]/10 text-lg px-8">
                How It Works
              </Button>
            </Link>
          </div>

          <p className="text-[#484F58] mt-6 text-sm">
            Starting at $49/month • Cancel anytime • Free shipping
          </p>
        </div>
      </section>

      {/* Value Propositions */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#161B22]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              PC Rental, <span className="text-[#00D9FF]">Your Way</span>
            </h2>
            <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
              We&apos;ve removed all the friction from getting a powerful computer. Here&apos;s what makes Flex different.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {valueProps.map((prop, index) => (
              <Card key={index} className="bg-[#161B22] border-[#30363D] hover:border-[#484F58] transition-all group">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-[#00D9FF]/10 group-hover:bg-[#00D9FF]/20 transition-colors">
                      <prop.icon className="h-6 w-6 text-[#00D9FF]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-2">{prop.title}</h3>
                      <p className="text-[#8B949E] text-sm">{prop.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section id="tiers" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Choose Your <span className="text-[#3DDC97]">Flex Tier</span>
            </h2>
            <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
              From everyday computing to high-performance gaming. Pick the tier that matches your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {subscriptionTiers.map((tier) => (
              <Card
                key={tier.id}
                className={`relative ${
                  tier.popular
                    ? 'bg-[#21262D] border-[#3DDC97] shadow-[0_0_30px_rgba(61,220,151,0.2)]'
                    : 'bg-[#161B22] border-[#30363D] hover:border-[#484F58]'
                } transition-all`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] text-[#0D1117] text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <CardHeader className={tier.popular ? 'pt-8' : ''}>
                  <CardTitle className="text-white text-2xl">{tier.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">${tier.price}</span>
                    <span className="text-[#8B949E]">/month</span>
                  </div>
                  <CardDescription className="text-[#8B949E]">{tier.description}</CardDescription>
                  <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    tier.color === 'cyan' ? 'bg-[#00D9FF]/10 text-[#00D9FF]' :
                    tier.color === 'green' ? 'bg-[#3DDC97]/10 text-[#3DDC97]' :
                    'bg-[#FF9F1C]/10 text-[#FF9F1C]'
                  }`}>
                    {tier.performance}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Specs */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[#8B949E]">
                      <Cpu className="h-4 w-4 text-[#484F58]" />
                      <span className="text-sm">{tier.specs.cpu}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#8B949E]">
                      <HardDrive className="h-4 w-4 text-[#484F58]" />
                      <span className="text-sm">{tier.specs.ram} • {tier.specs.storage}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#8B949E]">
                      <Monitor className="h-4 w-4 text-[#484F58]" />
                      <span className="text-sm">{tier.specs.gpu}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#30363D]" />

                  {/* Features */}
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[#8B949E] text-sm">
                        <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/login" className="block">
                    <Button className={`w-full ${
                      tier.popular
                        ? 'bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)]'
                        : 'bg-[#21262D] text-white hover:bg-[#30363D] border border-[#30363D]'
                    }`}>
                      Subscribe Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-[#484F58] mt-8 text-sm">
            All tiers include free shipping, warranty coverage, and 24/7 support access.
          </p>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#161B22]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why <span className="text-[#FF9F1C]">Subscribe</span> vs Buy?
            </h2>
            <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
              See how Flex compares to traditional purchasing and financing options.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-[#161B22] rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-[#21262D]">
                  <th className="py-4 px-6 text-white font-medium"></th>
                  <th className="py-4 px-6 text-center">
                    <div className="text-[#00D9FF] font-bold">Flex Subscription</div>
                    <div className="text-[#484F58] text-sm font-normal">$49-149/mo</div>
                  </th>
                  <th className="py-4 px-6 text-center">
                    <div className="text-white font-medium">Buy Outright</div>
                    <div className="text-[#484F58] text-sm font-normal">$800-2000+</div>
                  </th>
                  <th className="py-4 px-6 text-center">
                    <div className="text-white font-medium">Financing</div>
                    <div className="text-[#484F58] text-sm font-normal">$50-100/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[#8B949E]">
                <tr className="border-b border-[#30363D]">
                  <td className="py-4 px-6">Upfront Cost</td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-[#3DDC97] font-medium">$0</span>
                  </td>
                  <td className="py-4 px-6 text-center">$800-2000+</td>
                  <td className="py-4 px-6 text-center">$0-200</td>
                </tr>
                <tr className="border-b border-[#30363D]">
                  <td className="py-4 px-6">Long-term Commitment</td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <XCircle className="h-5 w-5 text-[#F85149] mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-[#30363D]">
                  <td className="py-4 px-6">Cancel Anytime</td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center text-[#484F58]">N/A</td>
                  <td className="py-4 px-6 text-center">
                    <XCircle className="h-5 w-5 text-[#F85149] mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-[#30363D]">
                  <td className="py-4 px-6">Warranty Included</td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">1 year typical</td>
                  <td className="py-4 px-6 text-center">1 year typical</td>
                </tr>
                <tr className="border-b border-[#30363D]">
                  <td className="py-4 px-6">Easy Upgrades</td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle2 className="h-5 w-5 text-[#3DDC97] mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <XCircle className="h-5 w-5 text-[#F85149] mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <XCircle className="h-5 w-5 text-[#F85149] mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6">Credit Check Required</td>
                  <td className="py-4 px-6 text-center">
                    <XCircle className="h-5 w-5 text-[#3DDC97] mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <XCircle className="h-5 w-5 text-[#3DDC97] mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle2 className="h-5 w-5 text-[#F85149] mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              What Our <span className="text-[#00D9FF]">Subscribers</span> Say
            </h2>
            <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
              Join hundreds of satisfied subscribers who chose flexibility over ownership.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-[#161B22] border-[#30363D] hover:border-[#484F58] transition-all">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 text-[#00D9FF]/30 mb-4" />
                  <p className="text-[#8B949E] mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{testimonial.name}</div>
                      <div className="text-[#484F58] text-sm">{testimonial.role}</div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-[#FF9F1C] fill-[#FF9F1C]" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#161B22]/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Frequently Asked <span className="text-[#3DDC97]">Questions</span>
            </h2>
            <p className="text-[#8B949E] text-lg">
              Everything you need to know about Flex PC subscriptions.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-[#161B22] border border-[#30363D] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#21262D] transition-colors"
                >
                  <span className="text-white font-medium">{item.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-[#8B949E]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#8B949E]" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4 text-[#8B949E]">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#00D9FF]/10 to-[#3DDC97]/10 border border-[#00D9FF]/30 rounded-2xl p-12">
            <Calendar className="h-12 w-12 text-[#00D9FF] mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-[#8B949E] text-lg mb-8 max-w-2xl mx-auto">
              Join Flex today and get a powerful PC shipped to your door. No commitment, no hassle.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all text-lg px-8">
                  Start Your Subscription
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/#support">
                <Button size="lg" variant="outline" className="bg-transparent text-[#00D9FF] border-[#00D9FF] hover:bg-[#00D9FF]/10 text-lg px-8">
                  Contact Sales
                </Button>
              </Link>
            </div>
            <p className="text-[#484F58] mt-6 text-sm">
              Free shipping • 30-day satisfaction guarantee • Cancel anytime
            </p>
          </div>
        </div>
      </section>

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
                <li><Link href="/subscription" className="text-[#8B949E] hover:text-white transition-colors text-sm">Rent a PC</Link></li>
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
