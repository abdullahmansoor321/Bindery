"use client";

import { useState } from "react";
import { updateMemberRole } from "@/app/actions/members";
import { Loader2 } from "lucide-react";

export function RoleSelect({
  workspaceId,
  membershipId,
  currentRole,
  isCurrentUser = false,
}: {
  workspaceId: string;
  membershipId: string;
  currentRole: "OWNER" | "EDITOR" | "VIEWER";
  isCurrentUser?: boolean;
}) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newRole: "OWNER" | "EDITOR" | "VIEWER") {
    if (newRole === role) return;
    const prev = role;
    setRole(newRole);
    setLoading(true);
    setError(null);

    try {
      await updateMemberRole({ workspaceId, membershipId, newRole });
    } catch (err: unknown) {
      setRole(prev);
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setLoading(false);
    }
  }

  if (currentRole === "OWNER" || isCurrentUser) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold uppercase tracking-wider bg-[#143325] text-[#FAF8F5]">
        {role}
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={role}
        disabled={loading}
        onChange={(e) =>
          handleChange(e.target.value as "OWNER" | "EDITOR" | "VIEWER")
        }
        className={`h-8 px-2.5 pr-6 text-xs font-semibold rounded-lg border transition-all focus:outline-none focus:ring-1 focus:ring-[#143325] bg-white cursor-pointer ${
          role === "EDITOR"
            ? "border-[#DFECE8] text-[#143325] bg-[#E9F0EC]/60"
            : "border-[#EAE5DC] text-[#6B6E6B]"
        }`}
      >
        <option value="EDITOR">EDITOR</option>
        <option value="VIEWER">VIEWER</option>
      </select>
      {loading && (
        <Loader2 className="w-3 h-3 animate-spin absolute right-2 text-[#6B6E6B] pointer-events-none" />
      )}
      {error && <span className="text-[10px] text-[#B83A3A] ml-2">{error}</span>}
    </div>
  );
}