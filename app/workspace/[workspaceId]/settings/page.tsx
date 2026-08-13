import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { RenameWorkspaceForm } from "./RenameWorkspaceForm";
import { DeleteWorkspaceForm } from "./DeleteWorkspaceForm";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // We fetch the caller's membership here too — the page itself needs
  // to know whether to even SHOW the Danger Zone, separately from the
  // Server Action re-checking it before actually deleting anything.
  // Neither check trusts the other; both are real.
  const callerMembership = await prisma.memberships.findUnique({
    where: {
      user_id_workspace_id: { user_id: user.id, workspace_id: workspaceId },
    },
  });

  if (!callerMembership) {
    notFound();
  }

  const workspace = await prisma.workspaces.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    notFound();
  }

  const isOwner = callerMembership.role === "OWNER";

  return (
    <div style={{ maxWidth: 480, margin: "60px auto" }}>
      <Link href={`/workspace/${workspaceId}/members`}>&larr; Back to members</Link>

      <h1 style={{ marginTop: 24 }}>Workspace Settings</h1>

      <section style={{ marginTop: 32 }}>
        <h2>General</h2>
        {isOwner ? (
          <RenameWorkspaceForm workspaceId={workspaceId} currentName={workspace.name} />
        ) : (
          <p style={{ color: "#888" }}>Workspace name: {workspace.name}</p>
        )}
      </section>

      {isOwner && (
        <section
          style={{
            marginTop: 48,
            padding: 16,
            border: "1px solid #e5484d",
            borderRadius: 8,
          }}
        >
          <h2 style={{ color: "#e5484d", marginTop: 0 }}>Danger Zone</h2>
          <p style={{ color: "#888" }}>
            Deleting this workspace permanently removes all its pages and
            members. This cannot be undone.
          </p>
          <DeleteWorkspaceForm workspaceId={workspaceId} workspaceName={workspace.name} />
        </section>
      )}
    </div>
  );
}