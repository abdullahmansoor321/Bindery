"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Reached only after Supabase's own verification step. The browser
// client below auto-detects the access_token sitting in the URL
// fragment on mount (detectSessionInUrl is on by default) and
// converts it into a real session — no code of ours needs to parse
// the fragment manually.
export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"checking" | "idle" | "loading" | "error" | "no-session">(
    "checking"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Give the browser client a moment to consume the URL fragment,
    // then confirm a session actually exists before letting anyone
    // try to submit the form — an expired or already-used link would
    // otherwise fail confusingly at submit time instead of up front.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? "idle" : "no-session");
    });
  }, [supabase]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (status === "checking") {
    return <p style={{ margin: 80, textAlign: "center" }}>Verifying your invite link...</p>;
  }

  if (status === "no-session") {
    return (
      <div style={{ maxWidth: 360, margin: "80px auto" }}>
        <h1>This link isn&apos;t valid</h1>
        <p>It may have expired or already been used. Ask whoever invited you to send a new one.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto" }}>
      <h1>Set your password</h1>
      <p>You&apos;ve been invited to Bindery — pick a password to finish setting up your account.</p>

      <form onSubmit={handleSetPassword}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        {status === "error" && <p style={{ color: "red" }}>{errorMessage}</p>}

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Saving..." : "Set password & continue"}
        </button>
      </form>
    </div>
  );
}