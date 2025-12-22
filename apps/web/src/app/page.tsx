'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, DollarSign, Headphones, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('refresh_token');
    if (hasToken) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Terminal Header */}
      <header className="border-b border-green-400 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">
              <span className="text-white">innozverse</span>
              <span className="text-green-400">:~$</span> cat README.md
            </div>
            <nav className="flex gap-6">
              <Link href="#features" className="hover:text-white transition-colors flex items-center gap-2">
                <span>[FEATURES]</span>
              </Link>
              <Link href="/pricing-bw" className="hover:text-white transition-colors flex items-center gap-2">
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
        {/* Hero Section */}
        <div className="mb-20">
          <pre className="text-xs sm:text-sm text-green-400 mb-8">
{`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ██╗███╗   ██╗███╗   ██╗ ██████╗ ███████╗██╗   ██╗███████╗██████╗ ║
║   ██║████╗  ██║████╗  ██║██╔═══██╗╚══███╔╝██║   ██║██╔════╝██╔══██╗║
║   ██║██╔██╗ ██║██╔██╗ ██║██║   ██║  ███╔╝ ██║   ██║█████╗  ██████╔╝║
║   ██║██║╚██╗██║██║╚██╗██║██║   ██║ ███╔╝  ╚██╗ ██╔╝██╔══╝  ██╔══██╗║
║   ██║██║ ╚████║██║ ╚████║╚██████╔╝███████╗ ╚████╔╝ ███████╗██║  ██║║
║   ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
`}
          </pre>

          <div className="text-center max-w-4xl mx-auto">
            <p className="text-2xl text-white mb-4">
              &gt; YOUR GATEWAY TO CUTTING-EDGE TECHNOLOGY LEARNING
            </p>
            <p className="text-lg mb-8">
              &gt; A comprehensive learning environment with detailed, ever-growing tutorials
              <br />
              &gt; Master security, programming, AI, and emerging technologies
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <button className="border-2 border-green-400 px-6 py-3 hover:bg-green-400 hover:text-black transition-colors font-bold">
                  &gt; START_LEARNING
                </button>
              </Link>
              <Link href="/pricing-bw">
                <button className="border-2 border-white px-6 py-3 text-white hover:bg-white hover:text-black transition-colors font-bold">
                  &gt; VIEW_PRICING
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">
            <span className="text-white">&gt;&gt;&gt;</span> WHAT WE OFFER <span className="text-white">&lt;&lt;&lt;</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Security */}
            <div className="border border-green-400 p-6 hover:bg-green-950 transition-colors">
              <pre className="text-xs mb-4">
{`┌─────────────┐
│  SECURITY   │
└─────────────┘`}
              </pre>
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Cybersecurity fundamentals</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Ethical hacking</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Defense strategies</span>
                </div>
              </div>
            </div>

            {/* Programming */}
            <div className="border border-green-400 p-6 hover:bg-green-950 transition-colors">
              <pre className="text-xs mb-4">
{`┌───────────────┐
│  PROGRAMMING  │
└───────────────┘`}
              </pre>
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Modern languages</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Frameworks & tools</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Best practices</span>
                </div>
              </div>
            </div>

            {/* AI */}
            <div className="border border-green-400 p-6 hover:bg-green-950 transition-colors">
              <pre className="text-xs mb-4">
{`┌──────────────┐
│  AI & ML     │
└──────────────┘`}
              </pre>
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Machine learning</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Deep learning</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Practical AI</span>
                </div>
              </div>
            </div>

            {/* Emerging Tech */}
            <div className="border border-green-400 p-6 hover:bg-green-950 transition-colors">
              <pre className="text-xs mb-4">
{`┌───────────────┐
│  EMERGING     │
│  TECH         │
└───────────────┘`}
              </pre>
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Blockchain</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Quantum computing</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Next-gen tech</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Pricing Overview */}
        <section className="mb-20 border border-green-400 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            <span className="text-white">&gt;&gt;&gt;</span> SUBSCRIPTION TIERS <span className="text-white">&lt;&lt;&lt;</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="border border-green-400 p-6">
              <div className="text-white font-bold text-lg mb-2">[ FREE ]</div>
              <div className="text-2xl text-white mb-4">$0/mo</div>
              <div className="text-sm space-y-2">
                <div>[✓] 1 VM remote access</div>
                <div>[✓] Basic tutorials</div>
                <div>[✓] Community support</div>
              </div>
            </div>

            <div className="border-2 border-white bg-green-950 p-6">
              <div className="text-white font-bold text-xs mb-2">POPULAR</div>
              <div className="text-white font-bold text-lg mb-2">[ ADVANCED SECURITY ]</div>
              <div className="text-2xl text-white mb-4">$29/mo</div>
              <div className="text-sm space-y-2">
                <div>[✓] 3 VMs (GUI available)</div>
                <div>[✓] Advanced labs</div>
                <div>[✓] Priority support</div>
              </div>
            </div>

            <div className="border border-green-400 p-6">
              <div className="text-white font-bold text-lg mb-2">[ PROGRAMMING ]</div>
              <div className="text-2xl text-white mb-4">$25/mo</div>
              <div className="text-sm space-y-2">
                <div>[✓] 2 VMs (headless)</div>
                <div>[✓] Programming courses</div>
                <div>[✓] Code labs & projects</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/pricing-bw">
              <button className="border-2 border-white px-8 py-3 text-white hover:bg-white hover:text-black transition-colors font-bold">
                &gt; VIEW_ALL_PRICING_OPTIONS
              </button>
            </Link>
          </div>
        </section>

        {/* Support Section */}
        <section id="support" className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">
            <span className="text-white">&gt;&gt;&gt;</span> SUPPORT & RESOURCES <span className="text-white">&lt;&lt;&lt;</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-green-400 p-6">
              <pre className="text-xs mb-4">
{`$ cat support.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
              </pre>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-white font-bold mb-1">[*] Expert Mentorship</div>
                  <div>Connect with industry professionals guiding your learning journey</div>
                </div>
                <div>
                  <div className="text-white font-bold mb-1">[*] Comprehensive Resources</div>
                  <div>Detailed documentation, video tutorials, and practical examples</div>
                </div>
                <div>
                  <div className="text-white font-bold mb-1">[*] 24/7 Community</div>
                  <div>Vibrant community of learners helping each other succeed</div>
                </div>
              </div>
            </div>

            <div className="border-2 border-white bg-green-950 p-6">
              <div className="text-white font-bold text-xl mb-4">
                READY TO TRANSFORM YOUR SKILLS?
              </div>
              <p className="mb-6">
                Join thousands of learners advancing their careers with innozverse
              </p>
              <Link href="/login">
                <button className="w-full border-2 border-white py-3 bg-white text-black hover:bg-green-400 transition-colors font-bold mb-4">
                  &gt; START_LEARNING_TODAY
                </button>
              </Link>
              <p className="text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-white underline hover:no-underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Terminal Info */}
        <div className="border border-green-400 p-6 mb-12">
          <pre className="text-xs">
{`$ whoami

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ABOUT INNOZVERSE

  A comprehensive learning environment with detailed, ever-growing
  tutorials for individuals and companies.

  Our mission: Empower learners to master security, programming,
  AI, and emerging technologies through hands-on, practical education.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$ exit
`}
          </pre>
        </div>
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-green-400 py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8 text-sm">
            <div>
              <div className="text-white font-bold mb-4">innozverse:~$</div>
              <p>A comprehensive learning environment for technology education</p>
            </div>
            <div>
              <div className="text-white font-bold mb-4">[QUICK LINKS]</div>
              <div className="space-y-2">
                <div><Link href="#features" className="hover:text-white transition-colors">&gt; features.txt</Link></div>
                <div><Link href="/pricing-bw" className="hover:text-white transition-colors">&gt; pricing.txt</Link></div>
                <div><Link href="#support" className="hover:text-white transition-colors">&gt; support.txt</Link></div>
              </div>
            </div>
            <div>
              <div className="text-white font-bold mb-4">[LEGAL]</div>
              <div className="space-y-2">
                <div><Link href="/about" className="hover:text-white transition-colors">&gt; about.txt</Link></div>
                <div><Link href="/privacy" className="hover:text-white transition-colors">&gt; privacy.txt</Link></div>
              </div>
            </div>
          </div>
          <div className="border-t border-green-400 pt-6 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} innozverse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
