import Link from 'next/link';
import { Home, DollarSign, Headphones } from 'lucide-react';

export default function PricingBWPage() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Terminal Header */}
      <header className="border-b border-green-400 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">
              <span className="text-white">innozverse</span>
              <span className="text-green-400">:~$</span> cat pricing.txt
            </div>
            <nav className="flex gap-6">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-2">
                <Home size={16} />
                <span>[HOME]</span>
              </Link>
              <Link href="/pricing" className="hover:text-white transition-colors flex items-center gap-2">
                <DollarSign size={16} />
                <span>[PRICING]</span>
              </Link>
              <Link href="#support" className="hover:text-white transition-colors flex items-center gap-2">
                <Headphones size={16} />
                <span>[SUPPORT]</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* ASCII Art Header */}
        <div className="mb-12 text-center">
          <pre className="text-xs sm:text-sm inline-block text-green-400">
{`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██████╗ ██╗ ██████╗██╗███╗   ██╗ ██████╗          ║
║   ██╔══██╗██╔══██╗██║██╔════╝██║████╗  ██║██╔════╝          ║
║   ██████╔╝██████╔╝██║██║     ██║██╔██╗ ██║██║  ███╗         ║
║   ██╔═══╝ ██╔══██╗██║██║     ██║██║╚██╗██║██║   ██║         ║
║   ██║     ██║  ██║██║╚██████╗██║██║ ╚████║╚██████╔╝         ║
║   ╚═╝     ╚═╝  ╚═╝╚═╝ ╚═════╝╚═╝╚═╝  ╚═══╝ ╚═════╝          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`}
          </pre>
          <p className="text-white mt-6 text-lg">
            &gt; Choose your subscription tier
          </p>
          <p className="text-green-400 mt-2">
            &gt; All prices shown in USD
          </p>
        </div>

        {/* Monthly/Yearly Toggle */}
        <div className="flex justify-center mb-12">
          <div className="border border-green-400 inline-block p-1">
            <div className="flex gap-2">
              <button className="px-6 py-2 bg-green-400 text-black font-bold">
                [X] MONTHLY
              </button>
              <button className="px-6 py-2 hover:bg-green-900 transition-colors">
                [ ] YEARLY (SAVE 17%)
              </button>
            </div>
          </div>
        </div>

        {/* VM-Based Subscription Tiers */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">
            <span className="text-white">&gt;&gt;&gt;</span> VM-BASED SUBSCRIPTIONS <span className="text-white">&lt;&lt;&lt;</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Free Tier */}
            <div className="border-2 border-green-400 p-6 hover:bg-green-950 transition-colors">
              <pre className="text-xs mb-4">
{`┌─────────────────┐
│     FREE        │
└─────────────────┘`}
              </pre>
              <div className="text-3xl font-bold mb-2 text-white">$0</div>
              <div className="text-sm text-green-400 mb-6">/month</div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>1 VM remote access</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Basic tutorials</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Community support</span>
                </div>
              </div>

              <button className="w-full border-2 border-green-400 py-2 hover:bg-green-400 hover:text-black transition-colors font-bold">
                &gt; GET_STARTED
              </button>
            </div>

            {/* Starter Security */}
            <div className="border-2 border-green-400 p-6 hover:bg-green-950 transition-colors">
              <pre className="text-xs mb-4">
{`┌─────────────────┐
│  STARTER SEC    │
└─────────────────┘`}
              </pre>
              <div className="text-3xl font-bold mb-2 text-white">$15</div>
              <div className="text-sm text-green-400 mb-6">/month or $150/year</div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>2 headless VMs</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Security focused</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Advanced tutorials</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Email support</span>
                </div>
              </div>

              <button className="w-full border-2 border-green-400 py-2 hover:bg-green-400 hover:text-black transition-colors font-bold">
                &gt; SUBSCRIBE
              </button>
            </div>

            {/* Advanced Security */}
            <div className="border-2 border-white bg-green-950 p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-3 border border-white text-white text-xs">
                POPULAR
              </div>
              <pre className="text-xs mb-4 text-white">
{`┌─────────────────┐
│  ADVANCED SEC   │
└─────────────────┘`}
              </pre>
              <div className="text-3xl font-bold mb-2 text-white">$29</div>
              <div className="text-sm text-green-400 mb-6">/month or $290/year</div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>3 VMs (GUI available)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Advanced security labs</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Expert tutorials</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Priority support</span>
                </div>
              </div>

              <button className="w-full border-2 border-white py-2 bg-white text-black hover:bg-green-400 transition-colors font-bold">
                &gt; SUBSCRIBE_NOW
              </button>
            </div>

            {/* Programming */}
            <div className="border-2 border-green-400 p-6 hover:bg-green-950 transition-colors">
              <pre className="text-xs mb-4">
{`┌─────────────────┐
│  PROGRAMMING    │
└─────────────────┘`}
              </pre>
              <div className="text-3xl font-bold mb-2 text-white">$25</div>
              <div className="text-sm text-green-400 mb-6">/month or $250/year</div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>2 VMs (headless)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Programming courses</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Code labs & projects</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Priority support</span>
                </div>
              </div>

              <button className="w-full border-2 border-green-400 py-2 hover:bg-green-400 hover:text-black transition-colors font-bold">
                &gt; SUBSCRIBE
              </button>
            </div>
          </div>
        </div>

        {/* Guest Passes */}
        <div>
          <h2 className="text-2xl font-bold mb-8 text-center">
            <span className="text-white">&gt;&gt;&gt;</span> GUEST PASSES <span className="text-white">&lt;&lt;&lt;</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* 1-Hour Pass */}
            <div className="border border-green-400 p-6 hover:bg-green-950 transition-colors">
              <pre className="text-xs mb-4">
{`┌──────────────┐
│   1 HOUR     │
└──────────────┘`}
              </pre>
              <div className="text-2xl font-bold mb-2 text-white">$5</div>
              <div className="text-sm text-green-400 mb-6">one-time</div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>1 hour VM access</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Basic features</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Try before subscribe</span>
                </div>
              </div>

              <button className="w-full border border-green-400 py-2 hover:bg-green-400 hover:text-black transition-colors font-bold">
                &gt; BUY_PASS
              </button>
            </div>

            {/* 1-Day Pass */}
            <div className="border border-green-400 p-6 hover:bg-green-950 transition-colors">
              <pre className="text-xs mb-4">
{`┌──────────────┐
│   1 DAY      │
└──────────────┘`}
              </pre>
              <div className="text-2xl font-bold mb-2 text-white">$15</div>
              <div className="text-sm text-green-400 mb-6">one-time</div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>24 hour VM access</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>All tutorials</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Perfect for projects</span>
                </div>
              </div>

              <button className="w-full border border-green-400 py-2 hover:bg-green-400 hover:text-black transition-colors font-bold">
                &gt; BUY_PASS
              </button>
            </div>

            {/* 1-Week Pass */}
            <div className="border border-green-400 p-6 hover:bg-green-950 transition-colors">
              <pre className="text-xs mb-4">
{`┌──────────────┐
│   1 WEEK     │
└──────────────┘`}
              </pre>
              <div className="text-2xl font-bold mb-2 text-white">$50</div>
              <div className="text-sm text-green-400 mb-6">one-time</div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>7 days VM access</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>All features</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Extended learning</span>
                </div>
              </div>

              <button className="w-full border border-green-400 py-2 hover:bg-green-400 hover:text-black transition-colors font-bold">
                &gt; BUY_PASS
              </button>
            </div>
          </div>
        </div>

        {/* Terminal Footer Info */}
        <div className="mt-16 border border-green-400 p-6 max-w-4xl mx-auto">
          <pre className="text-xs text-green-400">
{`$ cat info.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  FREQUENTLY ASKED QUESTIONS

  Q: Can I upgrade or downgrade my plan?
  A: Yes, you can change your subscription tier at any time.

  Q: What happens when my guest pass expires?
  A: Your VM access will be terminated. Save your work before expiry.

  Q: Do you offer refunds?
  A: Yes, within 7 days of purchase for monthly subscriptions.

  Q: What payment methods do you accept?
  A: Credit cards, PayPal, and cryptocurrency.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$ exit
`}
          </pre>
        </div>
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-green-400 mt-20 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm">
            <p className="text-green-400">
              innozverse:~$ whoami
            </p>
            <p className="text-white mt-2">
              &copy; 2025 Innozverse. All rights reserved.
            </p>
            <div className="flex justify-center gap-6 mt-4">
              <Link href="/about" className="hover:text-white transition-colors">
                [about.txt]
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                [privacy.txt]
              </Link>
              <Link href="#support" className="hover:text-white transition-colors">
                [support.txt]
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
