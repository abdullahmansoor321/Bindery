import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { EditPageForm } from "./EditPageForm";
import { RenamePageForm } from "./RenamePageForm";
import { TogglePublicButton } from "./TogglePublicButton";
import { DeletePageButton } from "./DeletePageButton";
import { ChevronRight, Clock, User as UserIcon } from "lucide-react";

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
    include: { users: { select: { email: true } } },
  });

  if (!page || page.workspace_id !== workspaceId) {
    notFound();
  }

  // Breadcrumb loop
  const breadcrumb: { id: string; title: string }[] = [];
  let currentParentId = page.parent_id;
  while (currentParentId) {
    const ancestor = await prisma.pages.findUnique({
      where: { id: currentParentId },
      select: { id: true, title: true, parent_id: true },
    });
    if (!ancestor) break;
    breadcrumb.unshift({ id: ancestor.id, title: ancestor.title });
    currentParentId = ancestor.parent_id;
  }

  const canEdit = callerMembership.role !== "VIEWER";
  // Resolve content from JSONB — supports both legacy { text } and new { html } shapes
  const rawContent = page.content as Record<string, unknown> | null;
  const contentHtml =
    typeof rawContent?.html === "string"
      ? rawContent.html
      : typeof rawContent?.text === "string"
      ? rawContent.text
          .split("\n")
          .map((line: string) => (line.trim() ? `<p>${line}</p>` : "<p></p>"))
          .join("")
      : "";
  const contentText = contentHtml;

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-12 space-y-8">
      {/* Top Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-[#6B6E6B] font-medium flex-wrap">
        <Link
          href={`/workspace/${workspaceId}`}
          className="hover:text-[#1F2421] transition-colors"
        >
          Workspace
        </Link>
        {breadcrumb.map((ancestor) => (
          <span key={ancestor.id} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-[#A3AAA3]" />
            <Link
              href={`/workspace/${workspaceId}/page/${ancestor.id}`}
              className="hover:text-[#1F2421] transition-colors truncate max-w-[150px]"
            >
              {ancestor.title}
            </Link>
          </span>
        ))}
        <ChevronRight className="w-3.5 h-3.5 text-[#A3AAA3]" />
        <span className="text-[#1F2421] font-semibold truncate max-w-[200px]">
          {page.title}
        </span>
      </nav>

      {/* Header Container */}
      <div className="space-y-4 pb-6 border-b border-[#EAE5DC]">
        {canEdit ? (
          <RenamePageForm pageId={pageId} initialTitle={page.title} />
        ) : (
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1F2421] tracking-tight">
            {page.title}
          </h1>
        )}

        {/* Metadata & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-[#6B6E6B]">
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[#143325]" />
              <span>
                {page.users?.email ? page.users.email.split("@")[0] : "Curator"}
              </span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {new Date(page.updated_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          {canEdit && (
            <div className="flex items-center gap-2">
              <TogglePublicButton
                pageId={pageId}
                initialIsPublic={page.is_public}
              />
              <DeletePageButton
                pageId={pageId}
                pageTitle={page.title}
                workspaceId={workspaceId}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Document Content Canvas */}
      <main className="pt-2">
        {canEdit ? (
          <EditPageForm pageId={pageId} initialContent={contentText} />
        ) : (
          <>
            <div
              className="bindery-editor prose-read"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
            {!contentHtml && (
              <p className="text-sm text-[#A3AAA3] italic">
                This document is currently empty.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}