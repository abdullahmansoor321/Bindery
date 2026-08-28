"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renameWorkspace } from "@/app/actions/workspace";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, Save } from "lucide-react";

export function RenameWorkspaceForm({
  workspaceId,
  currentName,
}: {
  workspaceId: string;
  currentName: string;
}) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentName) return;

    setLoading(true);
    setError(null);
    try {
      await renameWorkspace({ workspaceId, name: name.trim() });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to rename workspace");
    } finally {
      setLoading(false);
    }
  }

  const isUnchanged = name.trim() === currentName;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <Input
        label="Workspace Display Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
        required
      />

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B83A3A] font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={loading || !name.trim() || isUnchanged}
          loading={loading}
          icon={savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        >
          {savedSuccess ? "Saved!" : "Save Name"}
        </Button>
      </div>
    </form>
  );
}