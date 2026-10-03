import React, { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
});

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  const sanitizedHtml = useMemo(() => {
    if (!content) return "";
    try {
      const rawHtml = marked.parse(content) as string;
      return DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ["target", "rel"],
      });
    } catch (e) {
      console.error("Markdown parsing error:", e);
      return content;
    }
  }, [content]);

  return (
    <div
      className={`markdown-content text-sm leading-relaxed text-slate-800 space-y-2 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-0.5 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-300 [&_blockquote]:bg-blue-50/50 [&_blockquote]:px-3 [&_blockquote]:py-1.5 [&_blockquote]:italic [&_blockquote]:rounded-r [&_blockquote]:my-2 [&_code]:bg-slate-100 [&_code]:text-blue-700 [&_code]:font-mono [&_code]:text-xs [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:border [&_code]:border-slate-200 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:text-slate-100 [&_pre_code]:border-0 [&_pre_code]:p-0 [&_a]:text-blue-600 [&_a]:underline [&_a]:font-medium [&_strong]:font-bold [&_em]:italic ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default MarkdownRenderer;
