import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  Quote,
  Code,
  Paperclip,
} from "lucide-react";
import DOMPurify from "dompurify";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  onAttachFile?: () => void;
  isUploading?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Type your reply here...",
  minHeight = "120px",
  disabled = false,
  onAttachFile,
  isUploading = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
  });

  // Sync external value when changed externally (e.g. cleared on send or draft load)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (!value) {
        editorRef.current.innerHTML = "";
      } else if (editorRef.current.innerHTML === "" || !isFocused) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, isFocused]);

  const updateActiveFormats = () => {
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        list: document.queryCommandState("insertUnorderedList"),
      });
    } catch {
      // Ignore if document selection is out of range
    }
  };

  const handleFormat = (command: string, value: string | undefined = undefined) => {
    if (disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    updateActiveFormats();
    handleInput();
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const rawHtml = editorRef.current.innerHTML;
    // If only empty break or whitespace, treat as empty
    const text = editorRef.current.innerText.trim();
    if (!text && !rawHtml.includes("<img")) {
      onChange("");
    } else {
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      onChange(cleanHtml);
    }
  };

  const isEmpty = !value || value === "<br>" || value === "<p><br></p>";

  return (
    <div
      className={`rounded-2xl bg-white shadow-sm transition-all duration-200 ${
        isFocused
          ? "shadow-md ring-2 ring-blue-500/20"
          : "hover:shadow-md"
      }`}
    >
      {/* Google Keep style formatting toolbar */}
      <div className="flex flex-wrap items-center justify-between bg-slate-50/80 px-3.5 py-2 rounded-t-2xl">
        <div className="flex items-center gap-0.5 text-slate-600">
          <button
            type="button"
            title="Bold (Ctrl+B)"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat("bold");
            }}
            className={`rounded-lg p-1.5 transition ${
              activeFormats.bold
                ? "bg-blue-100 text-blue-700 font-bold"
                : "hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <Bold className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            title="Italic (Ctrl+I)"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat("italic");
            }}
            className={`rounded-lg p-1.5 transition ${
              activeFormats.italic
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <Italic className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            title="Underline (Ctrl+U)"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat("underline");
            }}
            className={`rounded-lg p-1.5 transition ${
              activeFormats.underline
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <Underline className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1.5 h-3.5 w-px bg-slate-200/80" />

          <button
            type="button"
            title="Bulleted List"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat("insertUnorderedList");
            }}
            className={`rounded-lg p-1.5 transition ${
              activeFormats.list
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            title="Quote"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat("formatBlock", "<blockquote>");
            }}
            className="rounded-lg p-1.5 hover:bg-slate-200/60 hover:text-slate-900 transition"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            title="Code Block"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat("formatBlock", "<pre>");
            }}
            className="rounded-lg p-1.5 hover:bg-slate-200/60 hover:text-slate-900 transition"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
        </div>

        {onAttachFile && (
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={onAttachFile}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 transition disabled:opacity-50"
          >
            <Paperclip className="h-3.5 w-3.5 text-slate-500" />
            {isUploading ? "Uploading..." : "Attach File"}
          </button>
        )}
      </div>

      {/* WYSIWYG Editable Canvas */}
      <div className="relative p-4">
        {isEmpty && !isFocused && (
          <div className="pointer-events-none absolute left-3.5 top-3.5 text-sm text-slate-400 select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={handleInput}
          onFocus={() => {
            setIsFocused(true);
            updateActiveFormats();
          }}
          onBlur={() => {
            setIsFocused(false);
            handleInput();
          }}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          style={{ minHeight }}
          className="wysiwyg-editor outline-none text-sm text-slate-900 leading-relaxed [&_b]:font-bold [&_b]:text-slate-950 [&_strong]:font-bold [&_strong]:text-slate-950 [&_i]:italic [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:bg-blue-50/50 [&_blockquote]:px-3 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:my-2 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2"
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
