import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { RenameWorkspaceForm } from "./RenameWorkspaceForm";
import { DeleteWorkspaceForm } from "./DeleteWorkspaceForm";
import { Settings, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";

export default async function WorkspaceSettingsPage({
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

  const isOwner = callerMembership.role === "OWNER";

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-12 space-y-8">
      {/* Top Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[#6B6E6B] font-medium">
        <Link
          href={`/workspace/${workspaceId}`}
          className="hover:text-[#1F2421] transition-colors"
        >
          {workspace.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#A3AAA3]" />
        <span className="text-[#1F2421] font-semibold">Settings</span>
      </nav>

      {/* Header Container */}
      <div className="space-y-1 pb-6 border-b border-[#EAE5DC]">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204D39]">
          <Settings className="w-4 h-4" />
          <span>Workspace Preferences</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1F2421]">
          Workspace Settings
        </h1>
        <p className="text-xs text-[#6B6E6B]">
          Configure workspace identity, metadata, and lifecycle settings.
        </p>
      </div>

      {/* General Settings Card */}
      <div className="bg-white border border-[#EAE5DC] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#143325]" />
            <h2 className="font-serif text-lg font-semibold text-[#1F2421]">
              General Information
            </h2>
          </div>
          <p className="text-xs text-[#6B6E6B]">
            The display name of your institutional knowledge base across the application.
          </p>
        </div>

        {isOwner ? (
          <RenameWorkspaceForm
            workspaceId={workspaceId}
            currentName={workspace.name}
          />
        ) : (
          <div className="p-4 bg-[#FAF8F5] border border-[#EAE5DC] rounded-xl text-xs text-[#6B6E6B]">
            Workspace name: <strong className="text-[#1F2421]">{workspace.name}</strong>{" "}
            <span className="italic">(Only Owners can rename the workspace)</span>
          </div>
        )}
      </div>

      {/* Danger Zone (Owner Only) */}
      {isOwner && (
        <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-[#B83A3A] shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-lg font-semibold text-[#B83A3A]">
                Danger Zone
              </h2>
              <p className="text-xs text-[#6B6E6B] leading-relaxed">
                Permanently deletes this entire workspace, along with all associated pages, documents, memberships, and chunks. This action cannot be recovered.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-red-200/60">
            <DeleteWorkspaceForm
              workspaceId={workspaceId}
              workspaceName={workspace.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}