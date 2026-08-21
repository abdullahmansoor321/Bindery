"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePage } from "@/app/actions/pages";

export function DeletePageButton({
  pageId,
  pageTitle,
  workspaceId,
}: {
  pageId: string;
  pageTitle: string;
  workspaceId: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleDelete() {
    // A plain confirm() is enough here — same reasoning as
    // RemoveMemberButton: this isn't FR-1.5's type-the-name level of
    // destructive (that's for whole workspaces), just a lighter
    // "are you sure," even though it does cascade to child pages.
    if (
      !confirm(
        `Delete "${pageTitle}"? If it has child pages, they'll be deleted too.`
      )
    ) {
      return;
    }

    setStatus("loading");
    try {
      await deletePage({ pageId });
      // The page we're standing on no longer exists — push back to
      // the workspace root, not refresh (nothing left here to refresh).
      router.push(`/workspace/${workspaceId}`);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div>
      <button onClick={handleDelete} disabled={status === "loading"}>
        {status === "loading" ? "Deleting..." : "Delete Page"}
      </button>
      {status === "error" && <p style={{ color: "red", fontSize: 12 }}>{errorMessage}</p>}
    </div>
  );
}