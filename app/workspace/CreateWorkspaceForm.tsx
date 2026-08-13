"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace } from "@/app/actions/workspace";

export function CreateWorkspaceForm() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleCreate() {
    setStatus("loading");
    setErrorMessage("");

    try {
      await createWorkspace({ name });

      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
      return;
    }

    setName("");
    setStatus("idle");
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Workspace name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={status === "loading"}
      />

      <button
        type="button"
        onClick={handleCreate}
        disabled={status === "loading" || !name.trim()}
      >
        {status === "loading" ? "Creating..." : "Create Workspace"}
      </button>

      {status === "error" && (
        <p style={{ color: "red" }}>{errorMessage}</p>
      )}
    </div>
  );
}