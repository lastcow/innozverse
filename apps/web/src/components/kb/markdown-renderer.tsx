'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
    <div className={cn('prose prose-neutral max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children: codeChildren, className: codeClassName, node, ...rest } = props;
            const match = /language-(\w+)/.exec(codeClassName || '');
            // Check if this is a code block (has language) or inline code
            // Code blocks have a language class, inline code does not
            const isCodeBlock = match !== null;

            if (isCodeBlock) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg !mt-4 !mb-4"
                >
                  {String(codeChildren).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            }

            // Inline code - only style with background if it's actual inline code (backticks)
            return (
              <code
                className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                {...rest}
              >
                {codeChildren}
              </code>
            );
          },
          h1: ({ children: h1Children }) => (
            <h1 className="scroll-mt-20 text-3xl font-bold mt-8 mb-4 text-foreground" id={slugify(String(h1Children))}>
              {h1Children}
            </h1>
          ),
          h2: ({ children: h2Children }) => (
            <h2 className="scroll-mt-20 text-2xl font-semibold mt-6 mb-3 border-b pb-2 text-foreground" id={slugify(String(h2Children))}>
              {h2Children}
            </h2>
          ),
          h3: ({ children: h3Children }) => (
            <h3 className="scroll-mt-20 text-xl font-semibold mt-5 mb-2 text-foreground" id={slugify(String(h3Children))}>
              {h3Children}
            </h3>
          ),
          h4: ({ children: h4Children }) => (
            <h4 className="scroll-mt-20 text-lg font-semibold mt-4 mb-2 text-foreground" id={slugify(String(h4Children))}>
              {h4Children}
            </h4>
          ),
          p: ({ children: pChildren }) => (
            <p className="leading-7 mb-4 text-foreground">
              {pChildren}
            </p>
          ),
          ul: ({ children: ulChildren }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">
              {ulChildren}
            </ul>
          ),
          ol: ({ children: olChildren }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">
              {olChildren}
            </ol>
          ),
          li: ({ children: liChildren }) => (
            <li className="leading-7 text-foreground">
              {liChildren}
            </li>
          ),
          blockquote: ({ children: bqChildren }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
              {bqChildren}
            </blockquote>
          ),
          a: ({ href, children: aChildren }) => (
            <a
              href={href}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {aChildren}
            </a>
          ),
          table: ({ children: tableChildren }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse border border-border">
                {tableChildren}
              </table>
            </div>
          ),
          thead: ({ children: theadChildren }) => (
            <thead className="bg-muted">
              {theadChildren}
            </thead>
          ),
          th: ({ children: thChildren }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold">
              {thChildren}
            </th>
          ),
          td: ({ children: tdChildren }) => (
            <td className="border border-border px-4 py-2">
              {tdChildren}
            </td>
          ),
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || ''}
              className="rounded-lg max-w-full h-auto my-4"
            />
          ),
          hr: () => (
            <hr className="my-8 border-border" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
