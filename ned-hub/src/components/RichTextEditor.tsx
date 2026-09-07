"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-5 space-y-1 my-1 text-slate-200",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-5 space-y-1 my-1 text-slate-200",
          },
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#14F195] underline hover:text-emerald-300 font-medium transition-colors",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[96px] max-h-[220px] overflow-y-auto p-3 text-xs text-white leading-relaxed selection:bg-[#9945FF] selection:text-white",
      },
    },
    onUpdate: ({ editor }) => {
      // If empty editor, pass empty string or HTML
      const html = editor.isEmpty ? "" : editor.getHTML();
      onChange(html);
    },
    immediatelyRender: false,
  });

  // Sync external content update (e.g. from API fetch or Clear button)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // If content is empty string and editor has content, clear it
      if (!content && !editor.isEmpty) {
        editor.commands.setContent("");
      } else if (content && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="w-full h-32 rounded-xl bg-[#0B0F19] border border-white/10 animate-pulse flex items-center justify-center text-xs text-slate-500">
        Đang khởi tạo trình soạn thảo...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Nhập địa chỉ liên kết (URL):", previousUrl);

    // Cancelled
    if (url === null) {
      return;
    }

    // Empty URL -> Unset link
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Set link with https:// if not present
    const validUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href: validUrl }).run();
  };

  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#0B0F19] focus-within:border-[#9945FF]/50 focus-within:ring-1 focus-within:ring-[#9945FF]/30 transition-all overflow-hidden flex flex-col">
      {/* ─── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="bg-[#0F1629] px-3 py-1.5 border-b border-white/10 flex flex-wrap items-center gap-1">
        {/* 1. In đậm (Bold) */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
            editor.isActive("bold")
              ? "bg-[#9945FF]/30 text-white border border-[#9945FF]/50 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
          title="In đậm (Ctrl+B)"
        >
          <span className="font-extrabold text-sm">B</span>
        </button>

        {/* 2. In nghiêng (Italic) */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-7 h-7 rounded-lg text-xs font-serif italic transition-all flex items-center justify-center ${
            editor.isActive("italic")
              ? "bg-[#9945FF]/30 text-white border border-[#9945FF]/50 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
          title="In nghiêng (Ctrl+I)"
        >
          <span className="text-sm">I</span>
        </button>

        {/* 3. Gạch chân (Underline) */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`w-7 h-7 rounded-lg text-xs underline transition-all flex items-center justify-center ${
            editor.isActive("underline")
              ? "bg-[#9945FF]/30 text-white border border-[#9945FF]/50 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
          title="Gạch chân (Ctrl+U)"
        >
          <span className="text-sm font-semibold">U</span>
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* 4. Danh sách chấm tròn (Bullet List) */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`w-7 h-7 rounded-lg text-xs transition-all flex items-center justify-center ${
            editor.isActive("bulletList")
              ? "bg-[#9945FF]/30 text-white border border-[#9945FF]/50 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
          title="Danh sách chấm tròn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="3" cy="6" r="1.5" fill="currentColor" />
            <circle cx="3" cy="12" r="1.5" fill="currentColor" />
            <circle cx="3" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </button>

        {/* 5. Danh sách số (Numbered List) */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`w-7 h-7 rounded-lg text-xs transition-all flex items-center justify-center ${
            editor.isActive("orderedList")
              ? "bg-[#9945FF]/30 text-white border border-[#9945FF]/50 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
          title="Danh sách số"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4M4 10h2" />
            <path d="M4 14h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H4v1h3" />
          </svg>
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* 6. Chèn liên kết (Link) */}
        <button
          type="button"
          onClick={setLink}
          className={`w-7 h-7 rounded-lg text-xs transition-all flex items-center justify-center ${
            editor.isActive("link")
              ? "bg-[#14F195]/20 text-[#14F195] border border-[#14F195]/40 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
          title="Chèn hoặc chỉnh sửa liên kết"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>

        {/* Unset Link (if link is active) */}
        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="px-2 h-7 rounded-lg text-[10px] font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1"
            title="Gỡ bỏ liên kết"
          >
            <span>Hủy link</span>
          </button>
        )}
      </div>

      {/* ─── Editor Content Area ────────────────────────────────────────────── */}
      <EditorContent editor={editor} />
    </div>
  );
}
