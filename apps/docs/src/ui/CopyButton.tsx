import { useEffect, useRef, useState } from 'react';

interface CopyButtonProps {
  text: string;
  label: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    },
    [],
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    setCopied(true);
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button type="button" className="docs-control docs-copy" onClick={handleCopy}>
      {copied ? '已复制' : label}
    </button>
  );
}
