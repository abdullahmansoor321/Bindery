"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// FR-1.1: creating a workspace and becoming its Owner is one atomic
// action — a transaction ensures we never end up with a workspace
// that has no Owner if the second insert somehow failed.
export async function createWorkspace(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const result = await supabase.auth.getUser();

console.log(result);


  if (!user) {
    throw new Error("Not authenticated");
  }

  if (!name || name.trim().length === 0) {
    throw new Error("Workspace name is required");
  }

  const workspace = await prisma.$transaction(async (tx) => {
    const newWorkspace = await tx.workspaces.create({
      data: {
        name: name.trim(),
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

