import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { EditPageForm } from "./EditPageForm";

export default async function PageDetailView({
  params,
}: {
  params: Promise<{ workspaceId: string; pageId: string }>;
}) {
  const { workspaceId, pageId } = await params;

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

  const page = await prisma.pages.findUnique({
    where: { id: pageId },
    include: { users: { select: { email: true } } }, // for "last edited by"
  });

  if (!page || page.workspace_id !== workspaceId) {
    // Second condition matters again here — same tenant-isolation
    // reasoning as createPage's parent check: a pageId from a
    // different workspace should never resolve, even if it's a
    // real, existing page.
    notFound();
  }

  // Breadcrumb — Option A: loop upward via parent_id until we hit a
  // page with no parent. This runs one query per level of depth —
  // fine at our expected tree size, and much easier to read than a
  // recursive SQL query for the same result.
  const breadcrumb: { id: string; title: string }[] = [];
  let currentParentId = page.parent_id;
  while (currentParentId) {
    const ancestor = await prisma.pages.findUnique({
      where: { id: currentParentId },
      select: { id: true, title: true, parent_id: true },
    });
    if (!ancestor) break; // safety: stop if a link is somehow broken
    breadcrumb.unshift({ id: ancestor.id, title: ancestor.title }); // unshift = add to the FRONT, so order comes out top-down
    currentParentId = ancestor.parent_id;
  }

  const canEdit = callerMembership.role !== "VIEWER";
  const contentText =
    typeof page.content === "object" && page.content !== null && "text" in page.content
      ? String((page.content as { text: unknown }).text)
      : "";

  return (
    <div style={{ maxWidth: 600, margin: "40px" }}>
      {/* Breadcrumb — only rendered if there IS an ancestor chain */}
      {breadcrumb.length > 0 && (
        <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
          {breadcrumb.map((ancestor) => (
            <span key={ancestor.id}>
              <Link href={`/workspace/${workspaceId}/page/${ancestor.id}`}>
                {ancestor.title}
              </Link>
              {" / "}
            </span>
          ))}
          <span>{page.title}</span>
        </div>
      )}

      <h1>{page.title}</h1>
      <p style={{ fontSize: 12, color: "#888" }}>
        Last edited by {page.users?.email ?? "unknown"} ·{" "}
        {page.updated_at.toLocaleString()}
      </p>

      {canEdit ? (
        <EditPageForm pageId={pageId} initialContent={contentText} />
      ) : (
        <p style={{ whiteSpace: "pre-wrap" }}>{contentText}</p>
      )}
    </div>
  );
}