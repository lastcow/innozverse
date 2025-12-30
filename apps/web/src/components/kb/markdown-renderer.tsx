'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function slugify(text?: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-lg max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children: codeChildren, className: codeClassName, node, ...rest } = props;
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code className="font-mono text-[#F0883E] bg-[#21262D] px-1.5 py-0.5 rounded text-sm" {...rest}>
                  {codeChildren}
                </code>
              );
            }
            return (
              <code className="font-mono text-[#C9D1D9]" {...rest}>
                {codeChildren}
              </code>
            );
          },
          pre: ({ children: preChildren }) => (
            <pre className="font-mono bg-[#0D1117] border border-[#30363D] rounded-lg p-4 my-4 text-sm overflow-x-auto">
              {preChildren}
            </pre>
          ),
          h1: ({ children: h1Children }) => (
            <h1 className="scroll-mt-20 text-3xl font-bold mt-8 mb-4 text-white" id={slugify(String(h1Children))}>
              {h1Children}
            </h1>
          ),
          h2: ({ children: h2Children }) => (
            <h2 className="scroll-mt-20 text-2xl font-semibold mt-8 mb-4 pb-2 border-b border-[#30363D] text-white" id={slugify(String(h2Children))}>
              {h2Children}
            </h2>
          ),
          h3: ({ children: h3Children }) => (
            <h3 className="scroll-mt-20 text-xl font-semibold mt-6 mb-3 text-white" id={slugify(String(h3Children))}>
              {h3Children}
            </h3>
          ),
          h4: ({ children: h4Children }) => (
            <h4 className="scroll-mt-20 text-lg font-semibold mt-5 mb-2 text-white" id={slugify(String(h4Children))}>
              {h4Children}
            </h4>
          ),
          p: ({ children: pChildren }) => (
            <p className="leading-8 mb-5 text-[#C9D1D9] text-base">
              {pChildren}
            </p>
          ),
          ul: ({ children: ulChildren }) => (
            <ul className="list-disc pl-6 mb-5 space-y-2 text-[#C9D1D9]">
              {ulChildren}
            </ul>
          ),
          ol: ({ children: olChildren }) => (
            <ol className="list-decimal pl-6 mb-5 space-y-2 text-[#C9D1D9]">
              {olChildren}
            </ol>
          ),
          li: ({ children: liChildren }) => (
            <li className="leading-7 text-[#C9D1D9]">
              {liChildren}
            </li>
          ),
          blockquote: ({ children: bqChildren }) => (
            <blockquote className="border-l-4 border-[#00D9FF] pl-4 py-2 my-5 bg-[#21262D] rounded-r-lg text-[#8B949E] italic">
              {bqChildren}
            </blockquote>
          ),
          a: ({ href, children: aChildren }) => (
            <a
              href={href}
              className="text-[#00D9FF] underline underline-offset-4 hover:text-[#33E1FF] transition-colors"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {aChildren}
            </a>
          ),
          table: ({ children: tableChildren }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse border border-[#30363D]">
                {tableChildren}
              </table>
            </div>
          ),
          thead: ({ children: theadChildren }) => (
            <thead className="bg-[#21262D]">
              {theadChildren}
            </thead>
          ),
          th: ({ children: thChildren }) => (
            <th className="border border-[#30363D] px-4 py-3 text-left font-semibold text-white">
              {thChildren}
            </th>
          ),
          td: ({ children: tdChildren }) => (
            <td className="border border-[#30363D] px-4 py-3 text-[#C9D1D9]">
              {tdChildren}
            </td>
          ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || ''}
              className="rounded-lg max-w-full h-auto my-6 border border-[#30363D]"
            />
          ),
          hr: () => (
            <hr className="my-8 border-[#30363D]" />
          ),
          strong: ({ children: strongChildren }) => (
            <strong className="font-semibold text-white">
              {strongChildren}
            </strong>
          ),
          em: ({ children: emChildren }) => (
            <em className="italic text-[#C9D1D9]">
              {emChildren}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
