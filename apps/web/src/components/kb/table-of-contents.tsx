'use client';

import { useMemo, useState, useEffect } from 'react';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  // Parse headings from markdown content
  const headings = useMemo(() => {
    const lines = content.split('\n');
    const items: TocItem[] = [];

    for (const line of lines) {
      // Match markdown headings (## Heading or ### Heading)
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = slugify(text);
        items.push({ id, text, level });
      }
    }

    return items;
  }, [content]);

  // Track active heading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
      }
    );

    // Observe all headings
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="sticky top-24">
      <div className="flex items-center gap-2 mb-4 text-[#8B949E]">
        <List className="h-4 w-4" />
        <span className="text-sm font-medium">On this page</span>
      </div>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            <button
              onClick={() => handleClick(heading.id)}
              className={`text-sm text-left w-full transition-colors hover:text-white ${
                activeId === heading.id
                  ? 'text-[#00D9FF]'
                  : 'text-[#8B949E]'
              }`}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
