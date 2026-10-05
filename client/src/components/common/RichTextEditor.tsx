import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  Code,
  Paperclip,
} from "lucide-react";
import DOMPurify from "dompurify";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
  onAttachFile?: () => void;
  isUploading?: boolean;
  topSlot?: React.ReactNode;
  bottomRightSlot?: React.ReactNode;
  attachmentsSlot?: React.ReactNode;
  containerClassName?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Type your reply here...",
  minHeight = "40px",
  maxHeight = "100px",
  disabled = false,
  onAttachFile,
  isUploading = false,
  topSlot,
  bottomRightSlot,
  attachmentsSlot,
  containerClassName = "",
  onKeyDown,
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

  const handleFormat = (command: string, formatValue: string | undefined = undefined) => {
    if (disabled) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, formatValue);
    updateActiveFormats();
    handleInput();
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const rawHtml = editorRef.current.innerHTML;
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
      onKeyDown={onKeyDown}
      className={`rounded-2xl transition-all duration-200 border shadow-2xs ${
        isFocused
          ? "border-blue-500/70 ring-2 ring-blue-500/10"
          : "border-slate-200/80 hover:border-slate-300"
      } ${containerClassName}`}
    >
      {/* Optional Top Slot: e.g. Public vs Internal toggle */}
      {topSlot}

      {/* Optional Attachments Slot */}
      {attachmentsSlot}

      {/* WYSIWYG Compact Editable Canvas */}
      <div className="relative px-3 py-2">
        {isEmpty && !isFocused && (
          <div className="pointer-events-none absolute left-3 top-2 text-xs sm:text-sm text-slate-400 select-none">
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
          style={{ minHeight, maxHeight }}
          className="wysiwyg-editor overflow-y-auto outline-none text-xs sm:text-sm text-slate-800 leading-relaxed custom-scrollbar [&_b]:font-bold [&_b]:text-slate-950 [&_strong]:font-bold [&_strong]:text-slate-950 [&_i]:italic [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_blockquote]:bg-blue-50/80 [&_blockquote]:px-2.5 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:rounded-lg [&_blockquote]:my-1 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-1"
        />
      </div>

      {/* Integrated Compact Bottom Toolbar & Actions */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-slate-100/80 bg-slate-50/60 rounded-b-2xl">
        {/* Left: Slim formatting icons + Paperclip */}
        <div className="flex items-center gap-0.5 text-slate-500">
          <button
            type="button"
            title="Bold (Ctrl+B)"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat("bold");
            }}
            className={`rounded-md p-1 transition ${
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
            className={`rounded-md p-1 transition ${
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
            className={`rounded-md p-1 transition ${
              activeFormats.underline
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <Underline className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            title="Bullet List"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat("insertUnorderedList");
            }}
            className={`rounded-md p-1 transition ${
              activeFormats.list
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-slate-200/60 hover:text-slate-900"
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            title="Code Block"
            disabled={disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              handleFormat("formatBlock", "<pre>");
            }}
            className="rounded-md p-1 hover:bg-slate-200/60 hover:text-slate-900 transition"
          >
            <Code className="h-3.5 w-3.5" />
          </button>

          {onAttachFile && (
            <button
              type="button"
              title="Attach File"
              disabled={disabled || isUploading}
              onClick={onAttachFile}
              className="rounded-md p-1 hover:bg-slate-200/60 hover:text-slate-900 transition ml-0.5 text-slate-500 hover:text-blue-600 disabled:opacity-50"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right: Shortcut hint & Send action */}
        {bottomRightSlot}
      </div>
    </div>
  );
};

export default RichTextEditor;
