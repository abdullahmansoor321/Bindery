"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteWorkspace } from "@/app/actions/workspace";

export function DeleteWorkspaceForm({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // This is the actual FR-1.5 requirement — the delete button stays
  // disabled until the typed text matches the real workspace name
  // EXACTLY (case-sensitive on purpose: a careless partial match, like
  // ignoring case, would defeat the point of the confirmation step).
  const isConfirmed = confirmText === workspaceName;

  async function handleDelete() {
    if (!isConfirmed) return;

    setStatus("loading");
    try {
      await deleteWorkspace({ workspaceId });
      // The page we're standing on no longer exists in the database
      // the instant this succeeds — router.push, not router.refresh,
      // since there's nothing left here to re-fetch.
      router.push("/workspace");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete workspace");
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <label style={{ fontSize: 14 }}>
        Type <strong>{workspaceName}</strong> to confirm:
      </label>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        disabled={status === "loading"}
        style={{ display: "block", marginTop: 4, marginBottom: 8 }}
      />

      <button
        onClick={handleDelete}
        disabled={!isConfirmed || status === "loading"}
        style={{
          background: isConfirmed ? "#e5484d" : "#ccc",
          color: "white",
          cursor: isConfirmed ? "pointer" : "not-allowed",
        }}
      >
        {status === "loading" ? "Deleting..." : "Delete Workspace Permanently"}
      </button>

      {status === "error" && <p style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );
}