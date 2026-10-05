"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { renamePage } from "@/app/actions/pages";
import { Button } from "@/components/ui/Button";
import { Check, Edit3, Save, X } from "lucide-react";

export function RenamePageForm({
  pageId,
  initialTitle,
}: {
  pageId: string;
  initialTitle: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function cancelEditing() {
    setDraftTitle(title);
    setError(null);
    setIsEditing(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setError("Page title is required");
      return;
    }

    if (nextTitle === title) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await renamePage({ pageId, title: nextTitle });
      setTitle(nextTitle);
      setDraftTitle(nextTitle);
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to rename page");
    } finally {
      setLoading(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-start gap-3">
        <h1 className="min-w-0 wrap-break-word font-serif text-3xl sm:text-4xl font-semibold text-[#1F2421] tracking-tight">
          {title}
        </h1>
        <button
          type="button"
          onClick={() => {
            setDraftTitle(title);
            setIsEditing(true);
          }}
          className="mt-1.5 shrink-0 p-2 rounded-md text-[#6B6E6B] hover:text-[#143325] hover:bg-[#F5F2EC] focus:outline-none focus:ring-2 focus:ring-[#143325]"
          aria-label={`Rename page: ${title}`}
          title="Rename page"
        >
          {saved ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          autoFocus
          aria-label="Page title"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancelEditing();
          }}
          maxLength={200}
          required
          disabled={loading}
          className="min-w-0 flex-1 border-b border-[#D1C9BC] bg-transparent py-1 font-serif text-3xl sm:text-4xl font-semibold text-[#1F2421] focus:outline-none focus:border-[#143325] disabled:opacity-50"
        />
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={loading}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={cancelEditing}
            icon={<X className="w-3.5 h-3.5" />}
          >
            Cancel
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-[#B83A3A] font-medium">{error}</p>}
    </form>
  );
}