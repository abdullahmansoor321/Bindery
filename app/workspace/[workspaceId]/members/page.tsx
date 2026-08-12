import { prisma } from "@/lib/prisma";
import { InviteForm } from "./InviteForm";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { RoleSelect } from "./RoleSelect";

// This is a Server Component — notice there's no "use client" at the
// top. That means this code runs on the server, and can talk directly
// to Prisma right here, with no API call needed. The finished HTML is
// sent to the browser already filled in with real data.
export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  // We fetch the workspace's memberships, and for each one, also pull
  // in the related user's email and profile info in the same query —
  // this is called an "include" (a join, in plain database terms).
  const memberships = await prisma.memberships.findMany({
    where: { workspace_id: workspaceId },
    include: {
      users: {
        select: {
          email: true,
          profiles: { select: { display_name: true, avatar_url: true } },
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  const workspace = await prisma.workspaces.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  return (
    <div style={{ maxWidth: 480, margin: "60px auto" }}>
      <h1>{workspace?.name} — Members</h1>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {memberships.map((m) => (
          <li
            key={m.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span>
              {m.users.profiles?.display_name ?? m.users.email}
              <br />
              <small style={{ color: "#888" }}>{m.users.email}</small>
            </span>
            <RoleSelect workspaceId={workspaceId} membershipId={m.id} currentRole={m.role} />
            <RemoveMemberButton workspaceId={workspaceId} membershipId={m.id} />
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: 32 }}>Invite someone</h2>
      <InviteForm workspaceId={workspaceId} />
    </div>
  );
}