"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePage } from "@/app/actions/pages";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function DeletePageButton({
  pageId,
  pageTitle,
  workspaceId,
}: {
  pageId: string;
  pageTitle: string;
  workspaceId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      await deletePage({ pageId });
      setIsOpen(false);
      router.push(`/workspace/${workspaceId}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete page");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EAE5DC] hover:border-red-200 hover:bg-red-50 text-xs font-semibold text-[#6B6E6B] hover:text-[#B83A3A] transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete Document"
        description="Are you sure you want to permanently delete this document?"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#6B6E6B] leading-relaxed">
            Deleting <span className="font-semibold text-[#1F2421]">&ldquo;{pageTitle}&rdquo;</span> will also delete all of its nested child sub-pages. This action cannot be undone.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B83A3A] font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE5DC]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={loading}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Document
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}