"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";
import { updatePageContent } from "@/app/actions/pages";
import { Button } from "@/components/ui/Button";
import { EditorToolbar } from "./EditorToolbar";
import { Check, Edit3, Save, FileText, Clock } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert the JSON stored in the DB (either plain text or Tiptap HTML) to an
 *  initialContent value that useEditor understands. */
function resolveInitialContent(raw: string): string {
  if (!raw || raw.trim() === "") return "";
  // If it already looks like HTML, use it directly
  if (raw.trimStart().startsWith("<")) return raw;
  // Otherwise wrap plain text paragraphs as HTML
  return raw
    .split(/\n/)
    .map((line) => (line.trim() ? `<p>${line}</p>` : "<p></p>"))
    .join("");
}

// ── Types ────────────────────────────────────────────────────────────────────

interface EditPageFormProps {
  pageId: string;
  initialContent: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export function EditPageForm({ pageId, initialContent }: EditPageFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const router = useRouter();

  const htmlContent = resolveInitialContent(initialContent);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default code-block so we can keep it simple (no lowlight needed for display)
        codeBlock: {},
      }),
      Placeholder.configure({
        placeholder: "Start writing… Use / or the toolbar above to format.",
        showOnlyWhenEditable: true,
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Highlight.configure({ multicolor: false }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
    ],
    content: htmlContent,
    editable: isEditing,
    editorProps: {
      attributes: {
        class: "bindery-editor",
        spellcheck: "true",
      },
    },
  });

  // Keep editor editable flag in sync with isEditing state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(isEditing);
    if (isEditing) {
      // Focus at end of document
      setTimeout(() => editor.commands.focus("end"), 50);
    }
  }, [editor, isEditing]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    setLoading(true);
    setError(null);
    const html = editor.getHTML();
    try {
      await updatePageContent({ pageId, content: html });
      setSavedSuccess(true);
      setLastSaved(new Date());
      setTimeout(() => setSavedSuccess(false), 2000);
      setIsEditing(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save content");
    } finally {
      setLoading(false);
    }
  }, [editor, pageId, router]);

  const handleCancel = useCallback(() => {
    if (!editor) return;
    // Reset to the original HTML without reloading the page
    editor.commands.setContent(htmlContent || "");
    setIsEditing(false);
    setError(null);
  }, [editor, htmlContent]);

  // ── Keyboard shortcut: ⌘S / Ctrl+S to save ────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isEditing, handleSave]);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;
  const isEmpty = !editor || editor.isEmpty;

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div className="space-y-5">
        {/* View mode header bar */}
        <div className="flex justify-between items-center pb-3 border-b border-[#EAE5DC]">
          <div className="flex items-center gap-2 text-xs text-[#A3AAA3]">
            <FileText className="w-3.5 h-3.5" />
            <span className="font-medium">
              {isEmpty
                ? "Empty document"
                : `${wordCount.toLocaleString()} word${wordCount !== 1 ? "s" : ""}`}
            </span>
            {lastSaved && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Saved{" "}
                  {lastSaved.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EAE5DC] hover:border-[#143325]/40 text-xs font-semibold text-[#143325] hover:bg-[#F5F2EC] transition-all shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Document</span>
          </button>
        </div>

        {/* Content preview */}
        {isEmpty ? (
          <div className="py-16 px-6 rounded-2xl bg-white border border-dashed border-[#D1C9BC] text-center space-y-4">
            <div className="mx-auto w-10 h-10 rounded-full bg-[#E9F0EC] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#143325]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#1F2421]">
                This page is empty
              </p>
              <p className="text-xs text-[#A3AAA3]">
                Click &quot;Edit Document&quot; to start writing
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              icon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Start writing
            </Button>
          </div>
        ) : (
          <div
            className="bindery-editor prose-read"
            onClick={() => setIsEditing(true)}
            title="Click to edit"
          >
            <EditorContent editor={editor} />
          </div>
        )}
      </div>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
      {/* Edit mode action bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E9F0EC] text-xs font-bold tracking-widest text-[#143325] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#449E73] animate-pulse" />
            Editing
          </span>
          <span className="text-xs text-[#A3AAA3]">
            {wordCount > 0
              ? `${wordCount.toLocaleString()} word${wordCount !== 1 ? "s" : ""} · ${charCount.toLocaleString()} char${charCount !== 1 ? "s" : ""}`
              : "Start typing…"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={loading}
            icon={
              savedSuccess ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )
            }
          >
            {savedSuccess ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor canvas */}
      <div
        className={`
          mt-2 min-h-[400px] p-5 sm:p-7 bg-white rounded-xl
          border transition-all duration-200
          ${error ? "border-[#B83A3A] ring-1 ring-[#B83A3A]" : "border-[#EAE5DC] focus-within:border-[#143325] focus-within:ring-1 focus-within:ring-[#143325]/30"}
          shadow-sm
        `}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Tip text */}
      <p className="text-[11px] text-[#A3AAA3] pt-1 flex items-center gap-1">
        <kbd className="px-1 py-0.5 rounded bg-[#F5F2EC] border border-[#EAE5DC] text-[10px] font-mono">⌘S</kbd>
        to save &nbsp;·&nbsp;
        <kbd className="px-1 py-0.5 rounded bg-[#F5F2EC] border border-[#EAE5DC] text-[10px] font-mono">Esc</kbd>
        to cancel
      </p>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#F8B4B4] text-xs text-[#B83A3A] font-medium">
          {error}
        </div>
      )}
    </div>
  );
}