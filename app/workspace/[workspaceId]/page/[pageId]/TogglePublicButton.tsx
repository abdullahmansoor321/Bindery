"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { togglePublic } from "@/app/actions/pages";

export function TogglePublicButton({
  pageId,
  initialIsPublic,
}: {
  pageId: string;
  initialIsPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const router = useRouter();

  async function handleToggle() {
    const next = !isPublic;
    setIsPublic(next); // optimistic, same pattern as RoleSelect
    setStatus("loading");
    try {
      await togglePublic({ pageId, isPublic: next });
      setStatus("idle");
      router.refresh();
    } catch (err) {
      setIsPublic(!next); // roll back on failure
      setStatus("error");
    }
  }

  return (
    <label style={{ fontSize: 12 }}>
      <input
        type="checkbox"
        checked={isPublic}
        onChange={handleToggle}
        disabled={status === "loading"}
      />
      {" "}Public
      {isPublic && (
        <span style={{ marginLeft: 8, color: "#888" }}>
          /p/{pageId}
        </span>
      )}
    </label>
  );
}