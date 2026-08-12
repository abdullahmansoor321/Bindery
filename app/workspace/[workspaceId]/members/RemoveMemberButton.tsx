"use client";

import { useState } from "react";
import { removeMember } from "@/app/actions/members";

export function RemoveMemberButton({
  workspaceId,
  membershipId,
}: {
  workspaceId: string;
  membershipId: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRemove() {
    // A plain browser confirm() is enough here — this isn't the
    // destructive, type-the-name-to-confirm level of FR-1.5's
    // workspace deletion, just a lighter "are you sure."
    if (!confirm("Remove this member from the workspace?")) return;

    setStatus("loading");
    try {
      await removeMember({ workspaceId, membershipId });
      // No router.refresh() needed here — revalidatePath inside the
      // action already tells Next.js this page's data is stale, so
      // it re-fetches automatically.
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  return (
    <div>
      <button onClick={handleRemove} disabled={status === "loading"}>
        {status === "loading" ? "Removing..." : "Remove"}
      </button>
      {status === "error" && <p style={{ color: "red", fontSize: 12 }}>{errorMessage}</p>}
    </div>
  );
}