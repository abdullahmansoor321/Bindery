"use client";

import { useState } from "react";
import { updateMemberRole } from "@/app/actions/members";

export function RoleSelect({
  workspaceId,
  membershipId,
  currentRole,
}: {
  workspaceId: string;
  membershipId: string;
  currentRole: "OWNER" | "EDITOR" | "VIEWER";
}) {
  const [role, setRole] = useState(currentRole);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleChange(newRole: "OWNER" | "EDITOR" | "VIEWER") {
    const previousRole = role;
    setRole(newRole); // optimistic update — feels instant
    setStatus("loading");

    try {
      await updateMemberRole({ workspaceId, membershipId, newRole });
      setStatus("idle");
    } catch (err) {
      setRole(previousRole); // roll back if the server rejected it
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  return (
    <div>
      <select
        value={role}
        disabled={status === "loading"}
        onChange={(e) => handleChange(e.target.value as "OWNER" | "EDITOR" | "VIEWER")}
      >
        <option value="OWNER">Owner</option>
        <option value="EDITOR">Editor</option>
        <option value="VIEWER">Viewer</option>
      </select>
      {status === "error" && <p style={{ color: "red", fontSize: 12 }}>{errorMessage}</p>}
    </div>
  );
}