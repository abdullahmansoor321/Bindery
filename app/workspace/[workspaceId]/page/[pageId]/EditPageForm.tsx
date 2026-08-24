"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePageContent } from "@/app/actions/pages";
import { Button } from "@/components/ui/Button";
import { Check, Edit3, Save } from "lucide-react";

export function EditPageForm({
  pageId,
  initialContent,
}: {
  pageId: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      await updatePageContent({ pageId, content });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      setIsEditing(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save content");
    } finally {
      setLoading(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center pb-2 border-b border-[#EAE5DC]">
          <span className="text-xs font-mono font-bold tracking-wider text-[#A3AAA3] uppercase">
            Document Content
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EAE5DC] hover:border-[#143325]/40 text-xs font-semibold text-[#143325] hover:bg-[#F5F2EC] transition-all shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Document</span>
          </button>
        </div>

        {content.trim() ? (
          <div className="prose max-w-none text-[#1F2421] text-base leading-[1.7] whitespace-pre-wrap font-sans">
            {content}
          </div>
        ) : (
          <div className="py-12 px-6 rounded-2xl bg-white border border-dashed border-[#D1C9BC] text-center space-y-3">
            <p className="text-sm text-[#6B6E6B]">
              This document is currently empty.
            </p>
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
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DC]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-wider text-[#143325] uppercase">
            Editing Mode
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setContent(initialContent);
              setIsEditing(false);
            }}
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
            icon={savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          >
            {savedSuccess ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your document content in markdown or plain text..."
        disabled={loading}
        rows={16}
        className="w-full p-4 bg-white border border-[#EAE5DC] text-[#1F2421] text-base leading-relaxed rounded-xl shadow-2xs focus:outline-none focus:border-[#143325] focus:ring-1 focus:ring-[#143325] font-sans resize-y"
      />

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B83A3A] font-medium">
          {error}
        </div>
      )}
    </div>
  );
}