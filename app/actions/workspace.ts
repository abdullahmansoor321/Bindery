"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Brought in line with members.ts's validation pattern — this was
// previously a manual if-check, which worked but was inconsistent
// with the rest of the codebase and weaker (no length cap, no
// explicit type guarantee at the boundary).
const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required").max(100),
});

// FR-1.1: creating a workspace and becoming its Owner is one atomic
// action — a transaction ensures we never end up with a workspace
// that has no Owner if the second insert somehow failed.
export async function createWorkspace(input: z.infer<typeof createWorkspaceSchema>) {
  const { name } = createWorkspaceSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const workspace = await prisma.$transaction(async (tx) => {
    const newWorkspace = await tx.workspaces.create({
      data: {
        name,
        owner_id: user.id,
      },
    });

    await tx.memberships.create({
      data: {
        user_id: user.id,
        workspace_id: newWorkspace.id,
        role: "OWNER",
      },
    });

    return newWorkspace;
  });

  revalidatePath("/");

  return workspace;
}

const deleteWorkspaceSchema = z.object({
  workspaceId: z.string().uuid(),
});

export async function deleteWorkspace(input: z.infer<typeof deleteWorkspaceSchema>) {
  const { workspaceId } = deleteWorkspaceSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Authorization consistent with the rest of the app: "Owner" means
  // memberships.role === "OWNER", not workspaces.owner_id — the
  // latter is fixed at creation, but updateMemberRole can grant OWNER
  // to additional people afterward. Checking owner_id alone would
  // wrongly block a promoted co-Owner from deleting the workspace.
  const callerMembership = await prisma.memberships.findUnique({
    where: {
      user_id_workspace_id: { user_id: user.id, workspace_id: workspaceId },
    },
  });

  if (!callerMembership || callerMembership.role !== "OWNER") {
    throw new Error("Only workspace owners can delete the workspace");
  }

  try {
    await prisma.workspaces.delete({
      where: { id: workspaceId },
    });
  } catch (err: any) {
    // P2025 = Prisma's "record not found" — can happen if the
    // workspace was already deleted (e.g. a double-click, or another
    // tab). Give a clean message instead of a raw Prisma error.
    if (err.code === "P2025") {
      throw new Error("This workspace no longer exists");
    }
    throw err;
  }

  revalidatePath("/");
}

const renameWorkspaceSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1, "Workspace name is required").max(100),
});

export async function renameWorkspace(input: z.infer<typeof renameWorkspaceSchema>) {
  const { workspaceId, name } = renameWorkspaceSchema.parse(input);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Same Owner-role-based authorization as deleteWorkspace — consistent
  // with the rest of the app, not tied to the original owner_id field.
  const callerMembership = await prisma.memberships.findUnique({
    where: {
      user_id_workspace_id: { user_id: user.id, workspace_id: workspaceId },
    },
  });

  if (!callerMembership || callerMembership.role !== "OWNER") {
    throw new Error("Only workspace owners can rename the workspace");
  }

  await prisma.workspaces.update({
    where: { id: workspaceId },
    data: { name },
  });

  revalidatePath(`/workspace/${workspaceId}/settings`);
  revalidatePath("/workspace");
}