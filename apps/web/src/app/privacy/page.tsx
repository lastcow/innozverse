import Link from 'next/link';
import { Home, DollarSign, Headphones } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Terminal Header */}
      <header className="border-b border-green-400 p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">
              <span className="text-white">innozverse</span>
              <span className="text-green-400">:~$</span> cat privacy.txt
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
║   ██████╗ ██████╗ ██╗██╗   ██╗ █████╗  ██████╗██╗   ██╗    ║
║   ██╔══██╗██╔══██╗██║██║   ██║██╔══██╗██╔════╝╚██╗ ██╔╝    ║
║   ██████╔╝██████╔╝██║██║   ██║███████║██║      ╚████╔╝     ║
║   ██╔═══╝ ██╔══██╗██║╚██╗ ██╔╝██╔══██║██║       ╚██╔╝      ║
║   ██║     ██║  ██║██║ ╚████╔╝ ██║  ██║╚██████╗   ██║       ║
║   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝   ╚═╝       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`}
          </pre>
          <div className="text-center text-white mb-4">
            Last Updated: {new Date().toISOString().split('T')[0]}
          </div>
        </div>

        {/* Introduction */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat introduction.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <p className="text-sm leading-relaxed">
            At Innozverse, we are committed to protecting your privacy and ensuring
            the security of your personal information. This Privacy Policy explains
            how we collect, use, disclose, and safeguard your information when you
            use our platform.
          </p>
        </div>

        {/* Information We Collect */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat information_collected.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-white font-bold mb-2">[1] PERSONAL INFORMATION</div>
              <div className="pl-4 space-y-1">
                <div>[✓] Name and email address</div>
                <div>[✓] Account credentials</div>
                <div>[✓] Payment information (processed securely)</div>
                <div>[✓] Profile information</div>
              </div>
            </div>

            <div>
              <div className="text-white font-bold mb-2">[2] USAGE INFORMATION</div>
              <div className="pl-4 space-y-1">
                <div>[✓] Learning progress and activity</div>
                <div>[✓] VM usage statistics</div>
                <div>[✓] Tutorial completion data</div>
                <div>[✓] Support interactions</div>
              </div>
            </div>

            <div>
              <div className="text-white font-bold mb-2">[3] TECHNICAL INFORMATION</div>
              <div className="pl-4 space-y-1">
                <div>[✓] IP address and device information</div>
                <div>[✓] Browser type and version</div>
                <div>[✓] Operating system</div>
                <div>[✓] Access times and referring URLs</div>
              </div>
            </div>
          </div>
        </div>

        {/* How We Use Your Information */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat usage.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-white">[+]</span>
              <span>Provide and maintain our services</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-white">[+]</span>
              <span>Process your subscription and payments</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-white">[+]</span>
              <span>Personalize your learning experience</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-white">[+]</span>
              <span>Send administrative and educational communications</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-white">[+]</span>
              <span>Improve our platform and develop new features</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-white">[+]</span>
              <span>Ensure security and prevent fraud</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-white">[+]</span>
              <span>Comply with legal obligations</span>
            </div>
          </div>
        </div>

        {/* Data Security */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat security.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="text-sm leading-relaxed space-y-3">
            <p>
              We implement industry-standard security measures to protect your
              personal information:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-white">[✓]</span>
                <span>Encryption of data in transit and at rest</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[✓]</span>
                <span>Secure authentication and access controls</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[✓]</span>
                <span>Regular security audits and updates</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[✓]</span>
                <span>Isolated VM environments for learning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Rights */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat your_rights.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="text-sm space-y-3">
            <p className="mb-2">You have the right to:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Access your personal information</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Correct inaccurate data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Request deletion of your data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Object to data processing</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Export your data</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Withdraw consent at any time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cookies and Tracking */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat cookies.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="text-sm leading-relaxed space-y-3">
            <p>
              We use cookies and similar tracking technologies to:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-white">[✓]</span>
                <span>Maintain your session and preferences</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[✓]</span>
                <span>Analyze platform usage and performance</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[✓]</span>
                <span>Provide personalized content</span>
              </div>
            </div>
            <p className="mt-3">
              You can manage cookie preferences through your browser settings.
            </p>
          </div>
        </div>

        {/* Third-Party Services */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat third_party.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="text-sm leading-relaxed space-y-3">
            <p>
              We may use third-party services for:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Payment processing (secure, PCI-compliant providers)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Analytics and performance monitoring</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Email communications</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>OAuth authentication (Google, GitHub)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat retention.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="text-sm leading-relaxed">
            <p>
              We retain your personal information for as long as necessary to
              provide our services and comply with legal obligations. After
              account deletion, we may retain certain data for:
            </p>
            <div className="space-y-2 mt-3">
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Legal compliance and dispute resolution</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Fraud prevention</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-white">[•]</span>
                <span>Backup and disaster recovery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Changes to Policy */}
        <div className="border border-green-400 p-6 mb-8">
          <pre className="text-xs mb-4">
{`$ cat updates.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`}
          </pre>
          <div className="text-sm leading-relaxed">
            <p>
              We may update this Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the &quot;Last Updated&quot; date. Continued use of our platform
              after changes constitutes acceptance of the updated policy.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="border-2 border-white bg-green-950 p-6 text-center">
          <div className="text-white font-bold text-xl mb-4">
            QUESTIONS ABOUT PRIVACY?
          </div>
          <p className="text-sm mb-6">
            If you have any questions or concerns about this Privacy Policy or
            our data practices, please contact us.
          </p>
          <div className="text-sm space-y-1">
            <div>Email: privacy@innozverse.ai</div>
            <div>Support: <Link href="/#support" className="text-white underline hover:no-underline">Contact Support</Link></div>
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
              <Link href="/about" className="hover:text-white transition-colors">
                [about.txt]
              </Link>
              <Link href="/pricing-bw" className="hover:text-white transition-colors">
                [pricing.txt]
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
