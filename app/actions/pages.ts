"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";

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

  // This is the actual connection point we left open — the ONLY place
  // in the whole app where a page's real content changes, so it's the
  // only place that should trigger re-embedding. The database write
  // above already succeeded by the time this fires, so even if the
  // event fails to send for some reason, the page save itself is safe
  // and unaffected — this can't roll back or block the save.
  await inngest.send({
    name: "page/content.saved",
    data: { pageId, workspaceId: page.workspace_id, text: content },
  });

  revalidatePath(`/workspace/${page.workspace_id}/page/${pageId}`);
}

const renamePageSchema = z.object({
  pageId: z.string().uuid(),
  title: z.string().trim().min(1, "Page title is required").max(200),
});

export async function renamePage(input: z.infer<typeof renamePageSchema>) {
  const { pageId, title } = renamePageSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    throw new Error("Not authenticated");
  }

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
    throw new Error("Viewers cannot rename pages");
  }

  await prisma.pages.update({
    where: { id: pageId },
    data: { title, last_edited_by: caller.id },
  });

  revalidatePath(`/workspace/${page.workspace_id}`, "layout");
  if (page.is_public) {
    revalidatePath(`/p/${pageId}`);
  }
}

// ============================================================
// wouldCreateCycle — the actual cycle-prevention logic, kept
// separate from movePage so it can be reasoned about (and tested)
// on its own.
// ============================================================
// Walks UPWARD from the proposed new parent — checking its parent,
// then that page's parent, and so on — until either:
//   (a) we hit a page with no parent (top-level) → no cycle, safe
//   (b) we find pageBeingMoved somewhere in that chain → CYCLE
async function wouldCreateCycle(
  pageBeingMoved: string,
  proposedNewParentId: string | null
): Promise<boolean> {
  // Moving a page to top-level (no parent) can never create a cycle —
  // there's no chain to walk at all.
  if (proposedNewParentId === null) {
    return false;
  }

  // A page can't be its own parent — this is the simplest possible
  // cycle (chain length zero), worth checking explicitly before the
  // loop even starts.
  if (proposedNewParentId === pageBeingMoved) {
    return true;
  }

  let currentId: string | null = proposedNewParentId;

  while (currentId) {
    const current: { parent_id: string | null } | null = await prisma.pages.findUnique({
      where: { id: currentId },
      select: { parent_id: true },
    });

    if (!current) break; // broken chain — shouldn't happen, but don't loop forever

    if (current.parent_id === pageBeingMoved) {
      return true; // found it — pageBeingMoved is an ancestor of the target
    }

    currentId = current.parent_id;
  }

  return false;
}

// ============================================================
// movePage — FR-2.3, the sensitive one
// ============================================================
const movePageSchema = z.object({
  pageId: z.string().uuid(),
  newParentId: z.string().uuid().nullable(),
  // Option B, as discussed: the frontend just says "put it after THIS
  // sibling" (or null for "make it the first child") — the server
  // calculates the actual fractional position itself, so the client
  // never has to know/trust stale position numbers.
  afterSiblingId: z.string().uuid().nullable(),
});

export async function movePage(input: z.infer<typeof movePageSchema>) {
  const { pageId, newParentId, afterSiblingId } = movePageSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    throw new Error("Not authenticated");
  }

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
    throw new Error("Viewers cannot move pages");
  }

  // Tenant check — same pattern as createPage's parent check. Both
  // newParentId AND afterSiblingId (if given) must belong to this
  // same workspace.
  if (newParentId) {
    const parentPage = await prisma.pages.findUnique({ where: { id: newParentId } });
    if (!parentPage || parentPage.workspace_id !== page.workspace_id) {
      throw new Error("Target parent not found in this workspace");
    }
  }

  // The cycle check — this is the whole point of this action existing
  // as carefully as it does.
  const isCycle = await wouldCreateCycle(pageId, newParentId);
  if (isCycle) {
    throw new Error("Cannot move a page into its own descendant");
  }

  // Position calculation — find the sibling we're placing this after,
  // and the one immediately following it in the target group, then
  // take the midpoint. If afterSiblingId is null, we're placing this
  // FIRST in the group, so we only need "the current first sibling."
  const siblingsInTargetGroup = await prisma.pages.findMany({
    where: { workspace_id: page.workspace_id, parent_id: newParentId },
    orderBy: { position: "asc" },
    select: { id: true, position: true },
  });

  let newPosition: number;

  if (afterSiblingId === null) {
    // Becoming the first child: go just before whatever is currently
    // first (or position 1.0 if the group is empty).
    const firstSibling = siblingsInTargetGroup[0];
    newPosition = firstSibling ? firstSibling.position / 2 : 1.0;
  } else {
    const afterIndex = siblingsInTargetGroup.findIndex((s) => s.id === afterSiblingId);
    if (afterIndex === -1) {
      throw new Error("Reference sibling not found in target group");
    }
    const afterSibling = siblingsInTargetGroup[afterIndex];
    const nextSibling = siblingsInTargetGroup[afterIndex + 1]; // may be undefined if afterSibling is currently last

    newPosition = nextSibling
      ? (afterSibling.position + nextSibling.position) / 2
      : afterSibling.position + 1.0; // last in the group — same "+1" pattern as createPage
  }

  await prisma.pages.update({
    where: { id: pageId },
    data: { parent_id: newParentId, position: newPosition },
  });

  revalidatePath(`/workspace/${page.workspace_id}`);
}

// ============================================================
// deletePage — FR-2.4
// ============================================================
// No manual cleanup needed for children or page_chunks here — the
// database's ON DELETE CASCADE (set up in the schema) handles both
// automatically the moment this row is deleted. Same pattern as
// deleteWorkspace: we only ever delete the ONE row we were asked to.
const deletePageSchema = z.object({
  pageId: z.string().uuid(),
});

export async function deletePage(input: z.infer<typeof deletePageSchema>) {
  const { pageId } = deletePageSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    throw new Error("Not authenticated");
  }

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
    throw new Error("Viewers cannot delete pages");
  }

  try {
    await prisma.pages.delete({ where: { id: pageId } });
  } catch (err: any) {
    // Same P2025 handling as deleteWorkspace — covers the case where
    // the page was already deleted (e.g. a double-click, or deleted
    // via its parent's cascade a moment earlier).
    if (err.code === "P2025") {
      throw new Error("This page no longer exists");
    }
    throw err;
  }

  revalidatePath(`/workspace/${page.workspace_id}`);
}

// ============================================================
// togglePublic — FR-2.7
// ============================================================
const togglePublicSchema = z.object({
  pageId: z.string().uuid(),
  isPublic: z.boolean(),
});

export async function togglePublic(input: z.infer<typeof togglePublicSchema>) {
  const { pageId, isPublic } = togglePublicSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    throw new Error("Not authenticated");
  }

  const page = await prisma.pages.findUnique({ where: { id: pageId } });
  if (!page) {
    throw new Error("Page not found");
  }

  // Same edit-level permission as move/delete/edit-content — sharing
  // a page publicly is a meaningful change to who can see it, not a
  // read-only action, so Viewers are blocked here too.
  const callerMembership = await prisma.memberships.findUnique({
    where: {
      user_id_workspace_id: { user_id: caller.id, workspace_id: page.workspace_id },
    },
  });

  if (!callerMembership || callerMembership.role === "VIEWER") {
    throw new Error("Viewers cannot change page visibility");
  }

  await prisma.pages.update({
    where: { id: pageId },
    data: { is_public: isPublic },
  });

  // Revalidate BOTH the private workspace view (so the public badge
  // updates) AND the public route itself — if someone just turned
  // sharing OFF, the public page needs to actually disappear, not
  // stay cached and reachable for a stale visitor.
  revalidatePath(`/workspace/${page.workspace_id}/page/${pageId}`);
  revalidatePath(`/p/${pageId}`);
}