"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// FR-1.1's real starting point: someone with no invite and no
// existing account, showing up to create their own first workspace.
// With "Confirm email" turned off in Supabase (a deliberate, noted
// decision — see chat), signUp() logs them in immediately, no
// confirmation email, no rate-limit risk.
export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    // Our database trigger (trg_on_auth_user_created) fires the
    // instant this row lands in auth.users — a matching `profiles`
    // row already exists by the time this redirect happens.
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto" }}>
      <h1>Create your account</h1>

      <form onSubmit={handleRegister}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        {status === "error" && <p style={{ color: "red" }}>{errorMessage}</p>}

        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}