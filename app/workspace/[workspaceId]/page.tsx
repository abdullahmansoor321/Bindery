import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageTreeNode } from "./PageTreeNode";
import { NewPageForm } from "./NewPageForm";

export default async function WorkspaceHomePage({
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

  // Only the TOP LEVEL is fetched here — parent_id: null. Everything
  // below this is lazy-loaded by PageTreeNode itself, on expand, per
  // the design doc's "don't load the whole tree at once" principle.
  const rootPages = await prisma.pages.findMany({
    where: { workspace_id: workspaceId, parent_id: null },
    orderBy: { position: "asc" },
    select: { id: true, title: true, position: true },
  });

  const canEdit = callerMembership.role !== "VIEWER";

  return (
    <div style={{ maxWidth: 320, margin: "40px" }}>
      <h1>{workspace.name}</h1>

      <div style={{ marginTop: 24 }}>
        {rootPages.map((page) => (
          <PageTreeNode
            key={page.id}
            workspaceId={workspaceId}
            page={page}
            canEdit={canEdit}
          />
        ))}
      </div>

      {canEdit && (
        <div style={{ marginTop: 16 }}>
          <NewPageForm workspaceId={workspaceId} parentId={null} />
        </div>
      )}
    </div>
  );
}