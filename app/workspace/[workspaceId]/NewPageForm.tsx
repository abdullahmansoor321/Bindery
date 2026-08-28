"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPage } from "@/app/actions/pages";
import { Plus, X, Loader2 } from "lucide-react";

type PageSummary = { id: string; title: string; position: number };

export function NewPageForm({
  workspaceId,
  parentId,
  onCreated,
}: {
  workspaceId: string;
  parentId: string | null;
  onCreated?: (page: PageSummary) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const page = await createPage({
        workspaceId,
        parentId,
        title: title.trim(),
      });
      setTitle("");
      setIsOpen(false);

      if (onCreated) {
        onCreated(page);
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create page");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-[#6B6E6B] hover:text-[#143325] hover:bg-[#EAE5DC]/50 rounded-md transition-colors"
      >
        <Plus className="w-3 h-3" />
        <span>Add page</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleCreate} className="space-y-1.5 p-1.5 bg-white border border-[#EAE5DC] rounded-lg shadow-xs">
      <div className="flex items-center gap-1">
        <input
          type="text"
          placeholder="Page title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          autoFocus
          className="flex-1 h-7 px-2 bg-[#FAF8F5] border border-[#EAE5DC] text-xs rounded text-[#1F2421] placeholder:text-[#A3AAA3] focus:outline-none focus:bg-white focus:border-[#143325]"
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="h-7 px-2 rounded bg-[#143325] text-[#FAF8F5] text-[11px] font-semibold hover:bg-[#204D39] disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setTitle("");
          }}
          className="p-1 text-[#6B6E6B] hover:text-[#1F2421] rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <p className="text-[10px] text-[#B83A3A] px-1">{error}</p>}
    </form>
  );
}