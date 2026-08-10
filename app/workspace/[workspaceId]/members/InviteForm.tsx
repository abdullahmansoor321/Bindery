"use client";

import { useState } from "react";
import { inviteMember } from "@/app/actions/members";

// "use client" at the top means this file runs in the browser. This
// is required here because we need useState (to remember what the
// user typed) and onClick (to react to a button press) — neither of
// those can exist in a Server Component.
export function InviteForm({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleInvite() {
    setStatus("loading");
    setErrorMessage("");

    try {
      // This is the actual call into our Server Action. Even though
      // it's written like a normal function call, Next.js sends this
      // as a network request to the server behind the scenes — we
      // never wrote that networking code ourselves.
      await inviteMember({ workspaceId, email, role });
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div>
      <input
        type="email"
        placeholder="teammate@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <select value={role} onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}>
        <option value="EDITOR">Editor</option>
        <option value="VIEWER">Viewer</option>
      </select>

      <button onClick={handleInvite} disabled={status === "loading" || !email}>
        {status === "loading" ? "Sending..." : "Send Invite"}
      </button>

      {status === "error" && <p style={{ color: "red" }}>{errorMessage}</p>}
      {status === "success" && <p style={{ color: "green" }}>Invite sent!</p>}
    </div>
  );
}