"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// This defines exactly what "valid input" looks like for this action.
// Zod is a validation library — instead of manually writing a bunch
// of "if (!email) throw..." checks, we describe the shape we expect
// once, and Zod checks it for us. If the form ever sends something
// malformed, this catches it before any database call happens.
const inviteSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]), // note: you can't invite someone as OWNER
});

export async function inviteMember(input: z.infer<typeof inviteSchema>) {
  // Step 1: validate the input against the schema above.
  // If it doesn't match, this line throws automatically — everything
  // after this point can safely assume the data is well-formed.
  const { workspaceId, email, role } = inviteSchema.parse(input);

  // Step 2: who is actually making this request?
  // This is "authentication" — proving WHO someone is.
  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    throw new Error("Not authenticated");
  }

  // Step 3: this is "authorization" — not just "who are you," but
  // "are you allowed to do THIS, HERE." We look up the caller's
  // membership row for this specific workspace and check their role.
  const callerMembership = await prisma.memberships.findUnique({
    where: {
      user_id_workspace_id: {
        user_id: caller.id,
        workspace_id: workspaceId,
      },
    },
  });

  if (!callerMembership || callerMembership.role !== "OWNER") {
    throw new Error("Only workspace owners can invite members");
  }

  // Step 4: the actual fork we walked through earlier — does this
  // email belong to someone who already has an account, or not?
  const existingUser = await prisma.users.findUnique({
    where: { email },
  });

  let invitedUserId: string;
  let isNewUser = false; // we'll need this later to decide what email to send
  let activationLink: string | undefined; // only set for brand-new users

  if (existingUser) {
    // SITUATION A: they already have an account. Nothing to create —
    // we already know their id, so we can skip straight to Step 6.
    invitedUserId = existingUser.id;
  } else {
    isNewUser = true;
    // SITUATION B: brand new person. We still use the admin client to
    // create their pending account — but instead of Supabase's
    // inviteUserByEmail() (which creates the account AND immediately
    // sends its own email — the email-sending part is what just hit
    // the rate limit), we use generateLink(). This creates the same
    // pending account but sends NO email itself — it just hands back
    // a real activation link, which we then email ourselves via
    // Resend in Step 5.5 below, alongside the existing-user email.
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        // generateLink is called from OUR server, not the invited
        // user's own browser — so unlike Google OAuth, there's no
        // PKCE code_verifier available, and Supabase issues session
        // tokens in the URL FRAGMENT (#access_token=...) instead of
        // a ?code= query param. Fragments never reach the server, so
        // we send this straight to a client-rendered page instead of
        // through /auth/callback (which only handles ?code=).
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/set-password`,
      },
    });

    if (error || !data.user) {
      throw new Error(`Failed to create invited user: ${error?.message}`);
    }

    invitedUserId = data.user.id;
    // Not using data.properties.action_link — that produces a link
    // with session tokens in the URL FRAGMENT (#access_token=...),
    // which @supabase/ssr's browser client can't consume: it's
    // hardcoded to PKCE flow (?code=) and doesn't parse fragments.
    // Instead we build our OWN link using token_hash — a normal query
    // parameter our server can verify directly, no browser-side
    // fragment parsing involved at all.
    activationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=invite&next=/auth/set-password`;
  }

  // Step 5: create the actual membership row — this is the moment
  // this person genuinely gains access to the workspace.
  try {
    await prisma.memberships.create({
      data: {
        user_id: invitedUserId,
        workspace_id: workspaceId,
        role,
      },
    });
  } catch (err: any) {
    // The database itself refuses duplicate (user_id, workspace_id)
    // pairs — this is the unique constraint from our schema doing its
    // job. Prisma's error code P2002 means "unique constraint failed."
    // We catch it here and turn it into a clear, human message instead
    // of letting a raw database error reach the user.
    if (err.code === "P2002") {
      throw new Error("This person is already a member of this workspace");
    }
    throw err;
  }

  // Step 5.5: now that the member has been added, send them an email
  // via Resend either way — but the CONTENT differs depending on
  // which situation we're in.
  const workspace = await prisma.workspaces.findUnique({
    where: { id: workspaceId },
    select: { name: true },
  });

  // We deliberately don't let a failed email crash the whole action —
  // the membership was already created successfully, which is the
  // part that actually matters. A missing email shouldn't undo real,
  // already-saved work.
  try {
    if (isNewUser) {
      // Brand-new person: they need the activation link, or they
      // have no way to ever log in and use their new access.
      await resend.emails.send({
        from: "Bindery <onboarding@resend.dev>",
        to: email,
        subject: `You've been invited to ${workspace?.name} on Bindery`,
        text: `You've been invited to join "${workspace?.name}" as a ${role.toLowerCase()}. Click here to activate your account: ${activationLink}`,
      });
    } else {
      // Existing user: they already have a working login — this is
      // just a courtesy heads-up, no link required.
      await resend.emails.send({
        from: "Bindery <onboarding@resend.dev>",
        to: email,
        subject: `You've been added to ${workspace?.name}`,
        text: `You now have ${role.toLowerCase()} access to the "${workspace?.name}" workspace on Bindery.`,
      });
    }
  } catch (emailError) {
    console.error("Failed to send invite email:", emailError);
  }

  // Step 6: tell Next.js "the member list for this workspace changed,
  // re-fetch it next time it's shown" — otherwise the UI could keep
  // showing stale data.
  revalidatePath(`/workspace/${workspaceId}/members`);
}

// ============================================================
// removeMember — FR-1.3
// ============================================================
const removeMemberSchema = z.object({
  workspaceId: z.string().uuid(),
  membershipId: z.string().uuid(), // the row to delete, not the user id
});

export async function removeMember(input: z.infer<typeof removeMemberSchema>) {
  const { workspaceId, membershipId } = removeMemberSchema.parse(input);

  // Step 1: same authentication + authorization pattern as inviteMember
  // — this is intentional consistency, not accidental repetition. Every
  // action that changes membership goes through the same two checks.
  const supabase = await createClient();
  const { data: { user: caller } } = await supabase.auth.getUser();

  if (!caller) {
    throw new Error("Not authenticated");
  }

  const callerMembership = await prisma.memberships.findUnique({
    where: {
      user_id_workspace_id: { user_id: caller.id, workspace_id: workspaceId },
    },
  });

  if (!callerMembership || callerMembership.role !== "OWNER") {
    throw new Error("Only workspace owners can remove members");
  }

  // Step 2: find the specific membership row we're being asked to
  // delete. We look it up by its own id, not by user_id, because the
  // form only knows "delete THIS row," not "delete whichever row
  // belongs to this user" — a small but deliberate distinction.
  const targetMembership = await prisma.memberships.findUnique({
    where: { id: membershipId },
  });

  if (!targetMembership || targetMembership.workspace_id !== workspaceId) {
    // The second half of this check matters: without it, an Owner of
    // Workspace A could pass in a membershipId that actually belongs
    // to Workspace B and remove someone from a workspace they have
    // no authority over at all.
    throw new Error("Membership not found in this workspace");
  }

  // Step 3: the last-Owner protection rule. If the person being
  // removed is an Owner, count how many Owners this workspace has
  // BEFORE removing them — if it's only one, refuse, or the
  // workspace would be left with nobody able to manage it at all.
  if (targetMembership.role === "OWNER") {
    const ownerCount = await prisma.memberships.count({
      where: { workspace_id: workspaceId, role: "OWNER" },
    });

    if (ownerCount <= 1) {
      throw new Error(
        "Cannot remove the last owner — transfer ownership first"
      );
    }
  }

  // Step 4: actually delete the row.
  await prisma.memberships.delete({
    where: { id: membershipId },
  });

  revalidatePath(`/workspace/${workspaceId}/members`);
}

// ============================================================
// updateMemberRole — FR-1.3
// ============================================================
const updateMemberRoleSchema = z.object({
  workspaceId: z.string().uuid(),
  membershipId: z.string().uuid(),
  newRole: z.enum(["OWNER", "EDITOR", "VIEWER"]),
});

export async function updateMemberRole(input: z.infer<typeof updateMemberRoleSchema>) {
  const { workspaceId, membershipId, newRole } = updateMemberRoleSchema.parse(input);

  const supabase = await createClient();
  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) {
    throw new Error("Not authenticated");
  }

  const callerMembership = await prisma.memberships.findUnique({
    where: {
      user_id_workspace_id: { user_id: caller.id, workspace_id: workspaceId },
    },
  });
  if (!callerMembership || callerMembership.role !== "OWNER") {
    throw new Error("Only workspace owners can update member roles");
  }

  const targetMembership = await prisma.memberships.findUnique({
    where: { id: membershipId },
  });
  if (!targetMembership || targetMembership.workspace_id !== workspaceId) {
    throw new Error("Membership not found in this workspace");
  }

  // Skip the write entirely if nothing's actually changing.
  if (targetMembership.role === newRole) {
    return;
  }

  // This is currently the ONLY place in the codebase that can create a
  // second Owner — createWorkspace always makes exactly one, and
  // inviteMember's schema deliberately excludes "OWNER" as an option.
  // That's exactly why the last-Owner check below matters here: before
  // this function existed, ownerCount could never have been anything
  // but 1, so this protection had nothing to guard against yet.
  if (targetMembership.role === "OWNER" && newRole !== "OWNER") {
    const ownerCount = await prisma.memberships.count({
      where: { workspace_id: workspaceId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      throw new Error("Cannot demote the last owner — transfer ownership first");
    }
  }

  await prisma.memberships.update({
    where: { id: membershipId },
    data: { role: newRole },
  });
  revalidatePath(`/workspace/${workspaceId}/members`);
}