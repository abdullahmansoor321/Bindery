"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPage } from "@/app/actions/pages";

type PageSummary = { id: string; title: string; position: number };

export function NewPageForm({
  workspaceId,
  parentId,
  onCreated,
}: {
  workspaceId: string;
  parentId: string | null;
  // Optional: lets a nested PageTreeNode add the new page straight
  // into its own already-loaded children list, instead of relying on
  // a full page refresh to see it appear.
  onCreated?: (page: PageSummary) => void;
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleCreate() {
    setStatus("loading");
    try {
      const page = await createPage({ workspaceId, parentId, title });
      setTitle("");
      setStatus("idle");

      if (onCreated) {
        onCreated(page); // nested case: update local tree state directly
      } else {
        router.refresh(); // top-level case: re-fetch the Server Component
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to create page");
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="New page title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={status === "loading"}
        style={{ fontSize: 12 }}
      />
      <button onClick={handleCreate} disabled={status === "loading" || !title.trim()}>
        {status === "loading" ? "..." : "+ Add"}
      </button>
      {status === "error" && <p style={{ color: "red", fontSize: 11 }}>{errorMessage}</p>}
    </div>
  );
}