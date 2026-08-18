"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePageContent } from "@/app/actions/pages";

export function EditPageForm({
  pageId,
  initialContent,
}: {
  pageId: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleSave() {
    setStatus("loading");
    try {
      await updatePageContent({ pageId, content });
      router.refresh(); // re-fetches the Server Component, updates "last edited" line
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={status === "loading"}
        rows={12}
        style={{ width: "100%", fontFamily: "inherit" }}
      />
      <button onClick={handleSave} disabled={status === "loading"}>
        {status === "loading" ? "Saving..." : "Save"}
      </button>
      {status === "error" && <p style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );
}