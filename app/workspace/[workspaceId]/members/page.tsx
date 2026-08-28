import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { InviteForm } from "./InviteForm";
import { RemoveMemberButton } from "./RemoveMemberButton";
import { RoleSelect } from "./RoleSelect";
import { Users, ChevronRight } from "lucide-react";

export default async function MembersPage({
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
    select: { name: true },
  });

  const memberships = await prisma.memberships.findMany({
    where: { workspace_id: workspaceId },
    include: {
      users: {
        select: {
          email: true,
          profiles: { select: { display_name: true, avatar_url: true } },
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  const isOwner = callerMembership.role === "OWNER";

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-12 space-y-8">
      {/* Top Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[#6B6E6B] font-medium">
        <Link
          href={`/workspace/${workspaceId}`}
          className="hover:text-[#1F2421] transition-colors"
        >
          {workspace?.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#A3AAA3]" />
        <span className="text-[#1F2421] font-semibold">Members</span>
      </nav>

      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE5DC]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204D39]">
            <Users className="w-4 h-4" />
            <span>Team Permissions</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1F2421]">
            Members & Roles
          </h1>
          <p className="text-xs text-[#6B6E6B]">
            Manage institutional access, invite contributors, and assign editing privileges.
          </p>
        </div>

        {isOwner && (
          <div className="shrink-0">
            <InviteForm workspaceId={workspaceId} />
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white border border-[#EAE5DC] rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-3.5 bg-[#FAF8F5] border-b border-[#EAE5DC] flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-[#A3AAA3]">
          <span>Member ({memberships.length})</span>
          <div className="flex items-center gap-12 pr-4">
            <span>Role</span>
            {isOwner && <span className="w-6 text-right">Action</span>}
          </div>
        </div>

        <ul className="divide-y divide-[#EAE5DC]">
          {memberships.map((m) => {
            const isSelf = m.user_id === user.id;
            const displayName =
              m.users.profiles?.display_name ||
              m.users.email?.split("@")[0] ||
              "Member";

            return (
              <li
                key={m.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-[#FAF8F5]/60 transition-colors"
              >
                {/* Member Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#143325] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1F2421] truncate">
                        {displayName}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#E9F0EC] text-[#143325] font-semibold">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#6B6E6B] font-mono truncate block">
                      {m.users.email}
                    </span>
                  </div>
                </div>

                {/* Role & Controls */}
                <div className="flex items-center gap-4">
                  {isOwner ? (
                    <RoleSelect
                      workspaceId={workspaceId}
                      membershipId={m.id}
                      currentRole={m.role}
                      isCurrentUser={isSelf}
                    />
                  ) : (
                    <span className="text-xs font-mono font-semibold uppercase text-[#1F2421] px-2.5 py-1 bg-[#F5F2EC] rounded-md">
                      {m.role}
                    </span>
                  )}

                  {isOwner && !isSelf && (
                    <div className="w-8 flex justify-end">
                      <RemoveMemberButton
                        workspaceId={workspaceId}
                        membershipId={m.id}
                        memberName={displayName}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}