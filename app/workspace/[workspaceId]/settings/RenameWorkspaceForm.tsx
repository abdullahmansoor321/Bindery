"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renameWorkspace } from "@/app/actions/workspace";

export function RenameWorkspaceForm({
  workspaceId,
  currentName,
}: {
  workspaceId: string;
  currentName: string;
}) {
  const [name, setName] = useState(currentName);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleSave() {
    setStatus("loading");
    try {
      await renameWorkspace({ workspaceId, name });
      router.refresh();
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to rename");
    }
  }

  const isUnchanged = name.trim() === currentName;

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={status === "loading"}
      />
      <button
        onClick={handleSave}
        disabled={status === "loading" || !name.trim() || isUnchanged}
      >
        {status === "loading" ? "Saving..." : "Save"}
      </button>
      {status === "error" && <p style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );
}