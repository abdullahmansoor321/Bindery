"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const createPageSchema = z.object({
  workspaceId: z.string().uuid(),
  parentId: z.string().uuid().nullable(), // null = top-level page
  title: z.string().trim().min(1, "Page title is required").max(200),
});

export async function createPage(input: z.infer<typeof createPageSchema>) {
  const { workspaceId, parentId, title } = createPageSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    throw new Error("Not authenticated");
  }

  // FR-2.1: Editors AND Owners can create pages — unlike invite/remove/
  // rename/delete workspace, which were Owner-only. So instead of
  // checking role === "OWNER", we check role IS NOT "VIEWER" — same
  // idea, opposite phrasing, because two roles are allowed here.
  const callerMembership = await prisma.memberships.findUnique({
    where: {
      user_id_workspace_id: { user_id: caller.id, workspace_id: workspaceId },
    },
  });

  if (!callerMembership || callerMembership.role === "VIEWER") {
    throw new Error("Viewers cannot create pages");
  }

  // If a parentId was given, confirm that page actually exists AND
  // belongs to this same workspace — without this check, someone
  // could pass a parentId from a completely different workspace and
  // effectively nest a page across tenant boundaries.
  if (parentId) {
    const parentPage = await prisma.pages.findUnique({
      where: { id: parentId },
    });
    if (!parentPage || parentPage.workspace_id !== workspaceId) {
      throw new Error("Parent page not found in this workspace");
    }
  }

  // Position: find the current highest position WITHIN this exact
  // group (same workspace, same parent — could be null for top-level)
  // and place the new page one spot after it. This is the piece from
  // our last conversation — the +1 only ever competes against
  // siblings, never the whole table.
  const lastSibling = await prisma.pages.aggregate({
    where: { workspace_id: workspaceId, parent_id: parentId },
    _max: { position: true },
  });

  const newPosition = (lastSibling._max.position ?? 0) + 1.0;

  const page = await prisma.pages.create({
    data: {
      workspace_id: workspaceId,
      parent_id: parentId,
      title,
      content: {}, // empty Tiptap-shaped doc for now; editor built in Step 5
      position: newPosition,
      last_edited_by: caller.id,
    },
  });

  revalidatePath(`/workspace/${workspaceId}`);

  return page;
}

// ============================================================
// getChildPages — needed for lazy-loading the tree
// ============================================================
// This is a "read" action, not a mutation — but it still needs to be
// a Server Action (not called directly from Prisma in a Client
// Component), because Client Components can NEVER touch Prisma
// directly. Any role (Owner/Editor/Viewer) can call this — reading
// is allowed for everyone, per FR-4.2 (only editing is restricted).
const getChildPagesSchema = z.object({
  workspaceId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
});

export async function getChildPages(input: z.infer<typeof getChildPagesSchema>) {
  const { workspaceId, parentId } = getChildPagesSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    throw new Error("Not authenticated");
  }

  // Membership check only (no role restriction) — this confirms the
  // caller belongs to this workspace at all, which is what actually
  // enforces tenant isolation (FR-4.1). Any role can read.
  const callerMembership = await prisma.memberships.findUnique({
    where: {
      user_id_workspace_id: { user_id: caller.id, workspace_id: workspaceId },
    },
  });

  if (!callerMembership) {
    throw new Error("Not a member of this workspace");
  }

  return prisma.pages.findMany({
    where: { workspace_id: workspaceId, parent_id: parentId },
    orderBy: { position: "asc" },
    select: { id: true, title: true, position: true }, // no content needed for a tree row
  });
}

// ============================================================
// updatePageContent — FR-2.2 / FR-2.8
// ============================================================
const updatePageContentSchema = z.object({
  pageId: z.string().uuid(),
  content: z.string(), // plain text for now; Tiptap's JSON shape comes in a later step
});

export async function updatePageContent(input: z.infer<typeof updatePageContentSchema>) {
  const { pageId, content } = updatePageContentSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    throw new Error("Not authenticated");
  }

  // We need the page's workspace_id to check the caller's role there —
  // pageId alone doesn't tell us which workspace's rules apply.
  const page = await prisma.pages.findUnique({ where: { id: pageId } });
  if (!page) {
    throw new Error("Page not found");
  }

  const callerMembership = await prisma.memberships.findUnique({
    where: {
      user_id_workspace_id: { user_id: caller.id, workspace_id: page.workspace_id },
    },
  });

  if (!callerMembership || callerMembership.role === "VIEWER") {
    throw new Error("Viewers cannot edit pages");
  }

  await prisma.pages.update({
    where: { id: pageId },
    data: {
      content: { text: content }, // wrapped in an object since the column is JSONB
      last_edited_by: caller.id,  // FR-2.8 — updated_at bumps automatically via our DB trigger
    },
  });

  revalidatePath(`/workspace/${page.workspace_id}/page/${pageId}`);
}