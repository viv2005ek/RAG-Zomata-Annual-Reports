import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const codeContent = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative group my-3">
      <button
        onClick={handleCopy}
        aria-label="Copy code to clipboard"
        className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
      </button>
      <pre className="!my-0">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

// Convert inline citation strings like "(Doc B, Page 248)" into clickable <sup> badges
function renderCitationsInText(text, onCitationClick) {
  if (typeof text !== 'string') return text;

  const citationRegex = /\((?:Doc(?:ument)?[\s\u202f]*([ABab])[^\d\n\r]{1,15}?(?:Page|P\.?|p\.?)[\s\u202f]*(\d+))\)/gi;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const doc = match[1].toUpperCase();
    const page = parseInt(match[2], 10);

    parts.push(
      <button
        key={`cit-${match.index}`}
        type="button"
        onClick={() => onCitationClick?.(doc, page)}
        className="citation-sup"
        title={`View evidence on Document ${doc}, Page ${page}`}
        aria-label={`Citation: Document ${doc}, Page ${page}`}
      >
        Doc {doc} · p.{page}
      </button>
    );

    lastIndex = citationRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function MarkdownRenderer({ content, chunksUsed = [] }) {
  const setSelectedSourceChunk = useSettingsStore((s) => s.setSelectedSourceChunk);

  const handleCitationClick = (doc, page) => {
    // Find matching chunk if present in chunksUsed
    const match = chunksUsed.find(
      (c) => c.doc_id === doc && (c.viewer_page === page || Number(c.viewer_page) === page)
    );
    if (match) {
      setSelectedSourceChunk(match);
    } else {
      setSelectedSourceChunk({
        doc_id: doc,
        viewer_page: page,
        fiscal_year: doc === 'A' ? 'FY 2024-25' : 'FY 2025-26',
        preview: `Evidence from Document ${doc}, Page ${page}.`,
      });
    }
  };

  return (
    <div className="assistant-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        skipHtml={true}
        components={{
          table({ children }) {
            return (
              <div className="table-wrap">
                <table>{children}</table>
              </div>
            );
          },
          tr({ children, ...props }) {
            // Heuristic check if row is total
            let isTotal = false;
            React.Children.forEach(children, (child) => {
              if (child && child.props && typeof child.props.children === 'string') {
                if (/total/i.test(child.props.children)) {
                  isTotal = true;
                }
              }
            });
            return (
              <tr className={isTotal ? 'total-row' : ''} {...props}>
                {children}
              </tr>
            );
          },
          td({ children, ...props }) {
            const strVal = String(children);
            // Numeric alignment heuristic
            const isNumeric = /^[\s₹$€£+\-%0-9.,()]+$/.test(strVal.trim());
            return (
              <td className={isNumeric ? 'num-col' : ''} {...props}>
                {typeof children === 'string' ? renderCitationsInText(children, handleCitationClick) : children}
              </td>
            );
          },
          th({ children, ...props }) {
            return <th {...props}>{children}</th>;
          },
          p({ children }) {
            return (
              <p>
                {React.Children.map(children, (child) => {
                  if (typeof child === 'string') {
                    return renderCitationsInText(child, handleCitationClick);
                  }
                  return child;
                })}
              </p>
            );
          },
          li({ children }) {
            return (
              <li>
                {React.Children.map(children, (child) => {
                  if (typeof child === 'string') {
                    return renderCitationsInText(child, handleCitationClick);
                  }
                  return child;
                })}
              </li>
            );
          },
          code({ inline, className, children, ...props }) {
            if (inline) {
              return <code className={className} {...props}>{children}</code>;
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
