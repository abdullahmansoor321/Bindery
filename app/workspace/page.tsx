import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateWorkspaceForm } from "./CreateWorskspaceForm";

// Server Component — fetches real data directly via Prisma, no API
// route needed. This replaces /test as the actual first real screen
// of the app: "here are the workspaces you belong to."
export default async function WorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already blocks unauthenticated access to this route, so
  // this is a defense-in-depth backstop, not the primary guard —
  // same pattern as createWorkspace checking auth independently too.
  if (!user) {
    redirect("/login");
  }

  // Joins memberships → workspaces, so we get each workspace's real
  // name and this user's role in it, in one query.
  const memberships = await prisma.memberships.findMany({
    where: { user_id: user.id },
    include: { workspaces: true },
    orderBy: { created_at: "asc" },
  });

  return (
    <div style={{ maxWidth: 480, margin: "60px auto" }}>
      <h1>Your Workspaces</h1>

      {memberships.length === 0 && (
        <p style={{ color: "#888" }}>
          You&apos;re not part of any workspace yet — create one below.
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {memberships.map((m) => (
          <li
            key={m.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <Link href={`/workspace/${m.workspace_id}/members`}>
              {m.workspaces.name}
            </Link>
            <span style={{ color: "#888" }}>{m.role}</span>
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: 32 }}>Create a new workspace</h2>
      <CreateWorkspaceForm />
    </div>
  );
}