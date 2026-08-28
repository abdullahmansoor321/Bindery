import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Sidebar } from "./Sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
    select: { id: true, name: true },
  });

  if (!workspace) {
    notFound();
  }

  // Fetch other workspaces for switcher
  const allMemberships = await prisma.memberships.findMany({
    where: { user_id: user.id },
    include: { workspaces: { select: { id: true, name: true } } },
  });
  const otherWorkspaces = allMemberships
    .map((m) => m.workspaces)
    .filter((w) => w.id !== workspaceId);

  // Fetch top-level root pages
  const rootPages = await prisma.pages.findMany({
    where: { workspace_id: workspaceId, parent_id: null },
    orderBy: { position: "asc" },
    select: { id: true, title: true, position: true },
  });

  const canEdit = callerMembership.role !== "VIEWER";

  return (
    <div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Fixed 280px Sidebar from Figma */}
      <Sidebar
        workspace={workspace}
        otherWorkspaces={otherWorkspaces}
        rootPages={rootPages}
        canEdit={canEdit}
        userEmail={user.email ?? ""}
        userRole={callerMembership.role}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
