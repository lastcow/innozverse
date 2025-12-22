import Link from 'next/link';
import { Home, DollarSign, Headphones } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Terminal Header */}
      <header className="border-b border-green-400 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">
              <span className="text-white">innozverse</span>
              <span className="text-green-400">:~$</span> cat about.txt
            </div>
            <nav className="flex gap-6">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-2">
                <Home size={16} />
                <span>[HOME]</span>
              </Link>
              <Link href="/pricing-bw" className="hover:text-white transition-colors flex items-center gap-2">
                <DollarSign size={16} />
                <span>[PRICING]</span>
              </Link>
              <Link href="/#support" className="hover:text-white transition-colors flex items-center gap-2">
                <Headphones size={16} />
                <span>[SUPPORT]</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Page Header */}
        <div className="mb-12">
          <pre className="text-xs sm:text-sm text-green-400">
{`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   █████╗ ██████╗  ██████╗ ██╗   ██╗████████╗               ║
║  ██╔══██╗██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝               ║
║  ███████║██████╔╝██║   ██║██║   ██║   ██║                  ║
║  ██╔══██║██╔══██╗██║   ██║██║   ██║   ██║                  ║
║  ██║  ██║██████╔╝╚██████╔╝╚██████╔╝   ██║                  ║
║  ╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚═════╝    ╚═╝                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`}
          </pre>
        </div>

        {/* Mission Section */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat mission.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="space-y-4">
            <div>
              <div className="text-white font-bold text-lg mb-2">&gt; OUR MISSION</div>
              <p className="text-sm leading-relaxed">
                To empower individuals and companies worldwide with cutting-edge technology
                education through a comprehensive learning environment featuring detailed,
                ever-growing tutorials.
              </p>
            </div>
            <div>
              <div className="text-white font-bold mb-2">&gt; WHAT WE DO</div>
              <p className="text-sm leading-relaxed">
                We provide hands-on, practical education across critical technology domains:
                security, programming, AI, and emerging technologies. Our platform combines
                VM-based learning environments with expert-curated content to deliver real-world
                skills that matter.
              </p>
            </div>
          </div>
        </div>

        {/* What We Offer Section */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat offerings.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-white font-bold mb-2">[1] SECURITY TRAINING</div>
              <div className="pl-4">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-white">[✓]</span>
                  <span>Cybersecurity fundamentals and advanced techniques</span>
                </div>
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-white">[✓]</span>
                  <span>Ethical hacking and penetration testing</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Defense strategies and security operations</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-white font-bold mb-2">[2] PROGRAMMING EDUCATION</div>
              <div className="pl-4">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-white">[✓]</span>
                  <span>Modern programming languages and frameworks</span>
                </div>
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-white">[✓]</span>
                  <span>Software development best practices</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Real-world projects and code labs</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-white font-bold mb-2">[3] AI & MACHINE LEARNING</div>
              <div className="pl-4">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-white">[✓]</span>
                  <span>Machine learning and deep learning fundamentals</span>
                </div>
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-white">[✓]</span>
                  <span>Practical AI implementation techniques</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Neural networks and model training</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-white font-bold mb-2">[4] EMERGING TECHNOLOGIES</div>
              <div className="pl-4">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-white">[✓]</span>
                  <span>Blockchain and distributed systems</span>
                </div>
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-white">[✓]</span>
                  <span>Quantum computing introduction</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white">[✓]</span>
                  <span>Next-generation technology trends</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Who We Serve Section */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat audience.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-white font-bold mb-2">&gt; FOR INDIVIDUALS</div>
              <p className="pl-4">
                Whether you&apos;re starting your tech journey or advancing your career,
                our platform provides the resources and hands-on labs you need to
                master cutting-edge technologies at your own pace.
              </p>
            </div>
            <div>
              <div className="text-white font-bold mb-2">&gt; FOR COMPANIES</div>
              <p className="pl-4">
                Upskill your teams with enterprise-grade training programs.
                Our VM-based learning environments provide safe, isolated spaces
                for employees to develop critical skills in security, programming,
                and emerging technologies.
              </p>
            </div>
            <div>
              <div className="text-white font-bold mb-2">&gt; FOR EDUCATORS</div>
              <p className="pl-4">
                Enhance your curriculum with practical, hands-on learning resources.
                Our detailed tutorials and lab environments complement traditional
                education with real-world applications.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat why_innozverse.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-white font-bold">[+]</span>
              <div>
                <span className="text-white font-bold">HANDS-ON LEARNING:</span>
                <span className="ml-2">Real VMs for practical, immersive experience</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-white font-bold">[+]</span>
              <div>
                <span className="text-white font-bold">EVER-GROWING CONTENT:</span>
                <span className="ml-2">Tutorials updated with latest industry trends</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-white font-bold">[+]</span>
              <div>
                <span className="text-white font-bold">EXPERT MENTORSHIP:</span>
                <span className="ml-2">Connect with industry professionals</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-white font-bold">[+]</span>
              <div>
                <span className="text-white font-bold">FLEXIBLE LEARNING:</span>
                <span className="ml-2">Learn at your own pace, on your schedule</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-white font-bold">[+]</span>
              <div>
                <span className="text-white font-bold">COMMUNITY SUPPORT:</span>
                <span className="ml-2">Vibrant learner community available 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="border-2 border-white bg-green-950 p-6 text-center">
          <div className="text-white font-bold text-xl mb-4">
            READY TO START YOUR JOURNEY?
          </div>
          <p className="mb-6">
            Join thousands of learners advancing their skills with innozverse
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login">
              <button className="border-2 border-white px-8 py-3 bg-white text-black hover:bg-green-400 transition-colors font-bold">
                &gt; GET_STARTED
              </button>
            </Link>
            <Link href="/pricing-bw">
              <button className="border-2 border-white px-8 py-3 text-white hover:bg-white hover:text-black transition-colors font-bold">
                &gt; VIEW_PRICING
              </button>
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm">
          <pre className="text-xs">
{`$ exit

innozverse:~$`}
          </pre>
        </div>
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-green-400 mt-12 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm">
            <p className="text-green-400">
              innozverse:~$ whoami
            </p>
            <p className="text-white mt-2">
              &copy; {new Date().getFullYear()} Innozverse. All rights reserved.
            </p>
            <div className="flex justify-center gap-6 mt-4">
              <Link href="/" className="hover:text-white transition-colors">
                [home.txt]
              </Link>
              <Link href="/pricing-bw" className="hover:text-white transition-colors">
                [pricing.txt]
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                [privacy.txt]
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
