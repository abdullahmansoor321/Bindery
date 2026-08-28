"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteWorkspace } from "@/app/actions/workspace";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Trash2 } from "lucide-react";

export function DeleteWorkspaceForm({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isConfirmed = confirmText === workspaceName;

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfirmed) return;

    setLoading(true);
    setError(null);
    try {
      await deleteWorkspace({ workspaceId });
      router.push("/workspace");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete workspace");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleDelete} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs text-[#6B6E6B] block">
          To confirm, type{" "}
          <strong className="text-[#1F2421] font-mono select-all font-bold">
            {workspaceName}
          </strong>{" "}
          below:
        </label>
        <Input
          type="text"
          placeholder={workspaceName}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B83A3A] font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="danger"
          size="sm"
          disabled={!isConfirmed || loading}
          loading={loading}
          icon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Delete Workspace Permanently
        </Button>
      </div>
    </form>
  );
}