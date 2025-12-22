interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  companyName?: string;
  year?: number;
  links?: FooterLink[];
  className?: string;
}

export function Footer({
  companyName = 'Innozverse',
  year = new Date().getFullYear(),
  links = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Support', href: '#' },
  ],
  className = '',
}: FooterProps) {
  return (
    <footer className={`border-t bg-background m-0 p-0 ${className}`}>
      <div className="w-full px-6 h-20 flex flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          © {year} {companyName}. All rights reserved.
        </p>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
