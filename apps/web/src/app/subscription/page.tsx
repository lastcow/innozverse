'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  Monitor,
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
  Tablet,
  Laptop,
  Gamepad2,
  Pen,
  Keyboard,
} from 'lucide-react';
import { ApiClient } from '@innozverse/api-client';
import { UserMenu } from '@/components/layout/user-menu';
import { config } from '@/lib/config';

const apiClient = new ApiClient(config.apiBaseUrl);

// Product categories
const productCategories = [
  {
    id: 'surface-pro',
    name: 'Surface Pro',
    icon: Tablet,
    description: 'Versatile 2-in-1 tablet for productivity on the go',
    color: 'cyan',
    variants: [
      {
        id: 'surface-pro-keyboard',
        name: 'Surface Pro + Keyboard',
        weeklyPrice: 75,
        monthlyPrice: 220,
        deposit: 350,
        includes: [
          'Surface Pro (latest gen)',
          'Type Cover Keyboard',
          'Power adapter & cables',
          'Protective sleeve',
        ],
        highlights: 'Perfect for note-taking and productivity',
      },
      {
        id: 'surface-pro-keyboard-pen',
        name: 'Surface Pro + Keyboard + Pen',
        weeklyPrice: 85,
        monthlyPrice: 250,
        deposit: 400,
        includes: [
          'Surface Pro (latest gen)',
          'Type Cover Keyboard',
          'Surface Pen',
          'Power adapter & cables',
          'Protective sleeve',
        ],
        highlights: 'Complete creative & note-taking setup',
        popular: true,
      },
    ],
  },
  {
    id: 'surface-laptop',
    name: 'Surface Laptop',
    icon: Laptop,
    description: 'Premium laptop with stunning display and all-day battery',
    color: 'green',
    variants: [
      {
        id: 'surface-laptop-standard',
        name: 'Surface Laptop',
        weeklyPrice: 65,
        monthlyPrice: 190,
        deposit: 300,
        includes: [
          'Surface Laptop (latest gen)',
          'Power adapter & cables',
          'Protective sleeve',
        ],
        highlights: 'Sleek design with exceptional performance',
      },
    ],
  },
  {
    id: 'xbox',
    name: 'Xbox Console',
    icon: Gamepad2,
    description: 'Next-gen gaming experience with powerful hardware',
    color: 'orange',
    variants: [
      {
        id: 'xbox-series-x-standard',
        name: 'Xbox Series X + Standard Controller',
        weeklyPrice: 30,
        monthlyPrice: 90,
        deposit: 225,
        includes: [
          'Xbox Series X Console',
          'Standard Wireless Controller',
          'HDMI cable',
          'Power cable',
        ],
        highlights: 'True 4K gaming at 120fps',
      },
      {
        id: 'xbox-series-x-elite',
        name: 'Xbox Series X + Elite Controller',
        weeklyPrice: 40,
        monthlyPrice: 120,
        deposit: 275,
        includes: [
          'Xbox Series X Console',
          'Elite Wireless Controller Series 2',
          'HDMI cable',
          'Power cable',
          'Controller charging dock',
        ],
        highlights: 'Pro-level gaming setup',
        popular: true,
      },
    ],
  },
];

// Value propositions
const valueProps = [
  {
    icon: Ban,
    title: 'No Long-Term Commitment',
    description: 'Weekly or monthly flexibility. Cancel anytime with no penalties or hidden fees.',
  },
  {
    icon: RefreshCw,
    title: 'Easy Swaps',
    description: 'Want to try something different? Swap your equipment whenever you want.',
  },
  {
    icon: Shield,
    title: 'Always Covered',
    description: 'Full warranty coverage included. If something breaks, we replace it fast.',
  },
  {
    icon: Package,
    title: 'Local Pickup',
    description: 'Pick up your equipment in-store and start using it the same day.',
  },
  {
    icon: Wrench,
    title: 'Well-Maintained',
    description: 'All equipment is thoroughly tested and maintained to ensure top performance.',
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
    name: 'Emily R.',
    role: 'Graduate Student',
    content: 'The Surface Pro rental was perfect for my thesis work. Having the pen made handwritten notes and diagrams so much easier. Returned it right after graduation!',
    rating: 5,
  },
  {
    name: 'Jason L.',
    role: 'Visiting Professional',
    content: 'Needed a laptop for a 2-month work assignment. The Surface Laptop was sleek, professional, and handled everything I needed. Great service!',
    rating: 5,
  },
  {
    name: 'Mike D.',
    role: 'Gaming Enthusiast',
    content: 'Rented the Xbox with Elite controller to try before buying. The Elite controller is a game-changer. Ended up extending my rental for another month!',
    rating: 5,
  },
];

// FAQ items
const faqItems = [
  {
    question: 'How does the rental work?',
    answer: 'Choose your equipment and rental period (weekly or monthly). Pick up at our location with a valid ID and credit card for the deposit. When you\'re done, return the equipment and get your deposit back.',
  },
  {
    question: 'What\'s the minimum rental period?',
    answer: 'The minimum rental period is 1 week. After that, you can extend weekly or switch to monthly billing for better rates.',
  },
  {
    question: 'How does the deposit work?',
    answer: 'We hold a refundable deposit on your credit card when you pick up the equipment. The full deposit is returned when you return the equipment in good condition.',
  },
  {
    question: 'What if something breaks?',
    answer: 'Normal wear and tear is covered. If something breaks during normal use, we\'ll replace it at no cost. Accidental damage may result in partial deposit deduction.',
  },
  {
    question: 'Can I extend my rental?',
    answer: 'Yes! You can extend your rental anytime. Just let us know before your current period ends, and we\'ll bill the next period automatically.',
  },
  {
    question: 'What\'s included with each rental?',
    answer: 'Each rental includes the main device plus all essential accessories (power adapters, cables, etc.). Check the specific product listing for the complete included items.',
  },
  {
    question: 'Is there a late fee?',
    answer: 'Yes, late returns are charged $15 per day. We recommend returning on time or extending your rental if you need more time.',
  },
  {
    question: 'Can I purchase the equipment instead?',
    answer: 'Yes! If you love the equipment, ask about our rent-to-own options. A portion of your rental payments can be applied toward purchase.',
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
                <span>Rent Equipment</span>
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
            <Package className="h-4 w-4 text-[#00D9FF]" />
            <span className="text-[#00D9FF] text-sm font-medium">Equipment Rental</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Rent Premium
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] to-[#3DDC97]">
              Microsoft Hardware
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#8B949E] max-w-3xl mx-auto mb-10">
            Surface devices and Xbox consoles available for weekly or monthly rental.
            Try before you buy, or rent just for when you need it.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="#products">
              <Button size="lg" className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all text-lg px-8">
                View Equipment
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
            Starting at $30/week • Local pickup • Refundable deposit
          </p>
        </div>
      </section>

      {/* Value Propositions */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#161B22]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Equipment Rental, <span className="text-[#00D9FF]">Made Simple</span>
            </h2>
            <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
              Get the hardware you need without the commitment of buying. Perfect for students, travelers, and try-before-you-buy.
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

      {/* Product Categories */}
      <section id="products" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Available <span className="text-[#3DDC97]">Equipment</span>
            </h2>
            <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
              Choose from our selection of premium Microsoft devices. All equipment is well-maintained and ready to use.
            </p>
          </div>

          <div className="space-y-16">
            {productCategories.map((category) => (
              <div key={category.id} className="space-y-6">
                {/* Category Header */}
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    category.color === 'cyan' ? 'bg-[#00D9FF]/10' :
                    category.color === 'green' ? 'bg-[#3DDC97]/10' :
                    'bg-[#FF9F1C]/10'
                  }`}>
                    <category.icon className={`h-8 w-8 ${
                      category.color === 'cyan' ? 'text-[#00D9FF]' :
                      category.color === 'green' ? 'text-[#3DDC97]' :
                      'text-[#FF9F1C]'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                    <p className="text-[#8B949E]">{category.description}</p>
                  </div>
                </div>

                {/* Variants Grid */}
                <div className={`grid gap-6 ${category.variants.length === 1 ? 'md:grid-cols-1 max-w-xl' : 'md:grid-cols-2'}`}>
                  {category.variants.map((variant) => (
                    <Card
                      key={variant.id}
                      className={`relative ${
                        variant.popular
                          ? 'bg-[#21262D] border-[#3DDC97] shadow-[0_0_30px_rgba(61,220,151,0.2)]'
                          : 'bg-[#161B22] border-[#30363D] hover:border-[#484F58]'
                      } transition-all`}
                    >
                      {variant.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] text-[#0D1117] text-xs font-bold px-4 py-1 rounded-full">
                            RECOMMENDED
                          </span>
                        </div>
                      )}

                      <CardHeader className={variant.popular ? 'pt-8' : ''}>
                        <CardTitle className="text-white text-xl">{variant.name}</CardTitle>
                        <CardDescription className="text-[#8B949E]">{variant.highlights}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        {/* Pricing */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-[#21262D] rounded-lg p-3">
                            <div className="text-2xl font-bold text-white">${variant.weeklyPrice}</div>
                            <div className="text-[#484F58] text-xs">per week</div>
                          </div>
                          <div className="bg-[#21262D] rounded-lg p-3">
                            <div className="text-2xl font-bold text-[#3DDC97]">${variant.monthlyPrice}</div>
                            <div className="text-[#484F58] text-xs">per month</div>
                          </div>
                          <div className="bg-[#21262D] rounded-lg p-3">
                            <div className="text-2xl font-bold text-[#8B949E]">${variant.deposit}</div>
                            <div className="text-[#484F58] text-xs">deposit</div>
                          </div>
                        </div>

                        <div className="border-t border-[#30363D]" />

                        {/* Includes */}
                        <div>
                          <div className="text-white font-medium text-sm mb-3">What&apos;s Included:</div>
                          <ul className="space-y-2">
                            {variant.includes.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-[#8B949E] text-sm">
                                <CheckCircle2 className="h-4 w-4 text-[#3DDC97] flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Link href="/login" className="block">
                          <Button className={`w-full ${
                            variant.popular
                              ? 'bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)]'
                              : 'bg-[#21262D] text-white hover:bg-[#30363D] border border-[#30363D]'
                          }`}>
                            Reserve Now
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[#484F58] mt-12 text-sm">
            All rentals include warranty coverage and full support. Deposits are fully refundable.
          </p>
        </div>
      </section>

      {/* Quick Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#161B22]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              <span className="text-[#FF9F1C]">Pricing</span> at a Glance
            </h2>
            <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
              Compare all rental options side by side.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-[#161B22] rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-[#21262D]">
                  <th className="py-4 px-6 text-white font-medium">Equipment</th>
                  <th className="py-4 px-6 text-white font-medium text-center">Weekly</th>
                  <th className="py-4 px-6 text-white font-medium text-center">Monthly</th>
                  <th className="py-4 px-6 text-white font-medium text-center">Deposit</th>
                </tr>
              </thead>
              <tbody className="text-[#8B949E]">
                <tr className="border-b border-[#30363D]">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Tablet className="h-5 w-5 text-[#00D9FF]" />
                      <span className="text-white">Surface Pro + Keyboard</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">$75</td>
                  <td className="py-4 px-6 text-center text-[#3DDC97]">$220</td>
                  <td className="py-4 px-6 text-center">$350</td>
                </tr>
                <tr className="border-b border-[#30363D] bg-[#00D9FF]/5">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Pen className="h-5 w-5 text-[#00D9FF]" />
                      <span className="text-white">Surface Pro + Keyboard + Pen</span>
                      <span className="text-xs bg-[#3DDC97]/20 text-[#3DDC97] px-2 py-0.5 rounded-full">Popular</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">$85</td>
                  <td className="py-4 px-6 text-center text-[#3DDC97]">$250</td>
                  <td className="py-4 px-6 text-center">$400</td>
                </tr>
                <tr className="border-b border-[#30363D]">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Laptop className="h-5 w-5 text-[#3DDC97]" />
                      <span className="text-white">Surface Laptop</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">$65</td>
                  <td className="py-4 px-6 text-center text-[#3DDC97]">$190</td>
                  <td className="py-4 px-6 text-center">$300</td>
                </tr>
                <tr className="border-b border-[#30363D]">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Gamepad2 className="h-5 w-5 text-[#FF9F1C]" />
                      <span className="text-white">Xbox Series X + Standard Controller</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">$30</td>
                  <td className="py-4 px-6 text-center text-[#3DDC97]">$90</td>
                  <td className="py-4 px-6 text-center">$225</td>
                </tr>
                <tr className="bg-[#FF9F1C]/5">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Gamepad2 className="h-5 w-5 text-[#FF9F1C]" />
                      <span className="text-white">Xbox Series X + Elite Controller</span>
                      <span className="text-xs bg-[#3DDC97]/20 text-[#3DDC97] px-2 py-0.5 rounded-full">Popular</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">$40</td>
                  <td className="py-4 px-6 text-center text-[#3DDC97]">$120</td>
                  <td className="py-4 px-6 text-center">$275</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4 text-center">
              <Keyboard className="h-6 w-6 text-[#00D9FF] mx-auto mb-2" />
              <div className="text-white font-medium">Add-on: Extra Controller</div>
              <div className="text-[#8B949E] text-sm">+$15/week or +$30/month</div>
            </div>
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4 text-center">
              <Shield className="h-6 w-6 text-[#3DDC97] mx-auto mb-2" />
              <div className="text-white font-medium">Damage Protection</div>
              <div className="text-[#8B949E] text-sm">+10% of rental fee</div>
            </div>
            <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4 text-center">
              <RefreshCw className="h-6 w-6 text-[#FF9F1C] mx-auto mb-2" />
              <div className="text-white font-medium">Monthly Discount</div>
              <div className="text-[#8B949E] text-sm">Save ~25% vs weekly</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              What Our <span className="text-[#00D9FF]">Renters</span> Say
            </h2>
            <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
              Join satisfied customers who chose flexibility.
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
              Everything you need to know about equipment rental.
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
              Ready to Rent?
            </h2>
            <p className="text-[#8B949E] text-lg mb-8 max-w-2xl mx-auto">
              Reserve your equipment today and pick it up at our location. No hassle, no commitment.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-[#00D9FF] to-[#3DDC97] hover:from-[#33E1FF] hover:to-[#5FE3AB] text-[#0D1117] font-semibold shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] transition-all text-lg px-8">
                  Reserve Equipment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/#support">
                <Button size="lg" variant="outline" className="bg-transparent text-[#00D9FF] border-[#00D9FF] hover:bg-[#00D9FF]/10 text-lg px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
            <p className="text-[#484F58] mt-6 text-sm">
              Local pickup only • Refundable deposit • Full warranty coverage
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
                <li><Link href="/subscription" className="text-[#8B949E] hover:text-white transition-colors text-sm">Rent Equipment</Link></li>
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
