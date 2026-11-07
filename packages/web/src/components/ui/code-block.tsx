import { Check, Copy } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';

interface CodeBlockProps {
  children: string;
  language?: string;
}

export function CodeBlock({ children, language = 'text' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-border bg-card relative overflow-hidden rounded-lg border">
      <div className="border-border bg-muted/50 flex items-center justify-between border-b px-4 py-2">
        <span className="text-muted-foreground text-xs font-medium uppercase">{language}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
          aria-label="Copy code"
        >
          <HugeiconsIcon icon={copied ? Check : Copy} className="size-3.5" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm">
        <code className="text-foreground font-mono">{children.trim()}</code>
      </pre>
    </div>
  );
}
