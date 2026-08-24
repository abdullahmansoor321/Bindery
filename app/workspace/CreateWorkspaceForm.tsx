"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/app/actions/workspace";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus } from "lucide-react";

export function CreateWorkspaceForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const ws = await createWorkspace({ name: name.trim() });
      setName("");
      router.push(`/workspace/${ws.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      <Input
        label="Workspace Name"
        placeholder="e.g. Design Systems, Legal Archive"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        disabled={loading}
      />

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B83A3A] font-medium">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={loading}
        disabled={!name.trim()}
        className="w-full"
        icon={<Plus className="w-4 h-4" />}
      >
        Create Workspace
      </Button>
    </form>
  );
}