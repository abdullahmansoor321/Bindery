import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import {
  BookOpen,
  FileText,
  Clock,
  Sparkles,
  Users,
  ArrowRight,
  Shield,
} from "lucide-react";

export default async function WorkspaceHomePage({
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
    include: {
      _count: {
        select: { pages: true, memberships: true },
      },
    },
  });

  if (!workspace) {
    notFound();
  }

  // Fetch recent pages for "Jump Back In"
  const recentPages = await prisma.pages.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { updated_at: "desc" },
    take: 6,
    include: {
      users: { select: { email: true } },
    },
  });

  const canEdit = callerMembership.role !== "VIEWER";

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-12 space-y-12">
      {/* Workspace Banner */}
      <div className="space-y-4 pb-6 border-b border-[#EAE5DC]">
        <div className="flex items-center gap-3">
          <Badge
            variant={
              callerMembership.role === "OWNER"
                ? "role-owner"
                : callerMembership.role === "EDITOR"
                ? "role-editor"
                : "role-viewer"
            }
          >
            {callerMembership.role}
          </Badge>
          <span className="text-xs text-[#6B6E6B] font-mono">
            {workspace._count.pages} {workspace._count.pages === 1 ? "page" : "pages"} · {workspace._count.memberships} {workspace._count.memberships === 1 ? "member" : "members"}
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1F2421]">
          {workspace.name}
        </h1>

        <p className="text-sm text-[#6B6E6B] max-w-2xl leading-relaxed">
          Welcome to your team&apos;s digital bookbindery. Browse recent archives, collaborate on new entries, or manage permissions below.
        </p>

        {/* Quick Top Links */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={`/workspace/${workspaceId}/members`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-[#EAE5DC] hover:border-[#143325]/40 text-xs font-semibold text-[#1F2421] transition-all shadow-2xs"
          >
            <Users className="w-3.5 h-3.5 text-[#143325]" />
            <span>Manage Team</span>
          </Link>
          <Link
            href={`/workspace/${workspaceId}/settings`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-[#EAE5DC] hover:border-[#143325]/40 text-xs font-semibold text-[#1F2421] transition-all shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-[#143325]" />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* "Jump Back In" / Recent Pages Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#204D39]" />
            <h2 className="font-serif text-xl font-semibold text-[#1F2421]">
              Jump back in
            </h2>
          </div>
          <span className="text-xs text-[#6B6E6B]">Recently edited</span>
        </div>

        {recentPages.length === 0 ? (
          <div className="p-8 bg-white border border-dashed border-[#D1C9BC] rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E9F0EC] flex items-center justify-center text-[#143325] mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#1F2421]">
              No documents created yet
            </h3>
            <p className="text-xs text-[#6B6E6B] max-w-sm mx-auto">
              Start building your workspace archive by clicking &ldquo;+&rdquo; in the sidebar navigation or adding a page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentPages.map((page) => (
              <Link
                key={page.id}
                href={`/workspace/${workspaceId}/page/${page.id}`}
                className="group p-5 bg-white border border-[#EAE5DC] rounded-xl shadow-xs hover:shadow-md hover:border-[#143325]/30 transition-all flex flex-col justify-between h-36"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <FileText className="w-4 h-4 text-[#143325] shrink-0" />
                    {page.is_public && (
                      <Badge variant="public" size="sm">
                        Public
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-serif text-base font-semibold text-[#1F2421] group-hover:text-[#143325] transition-colors line-clamp-1">
                    {page.title}
                  </h3>
                </div>

                <div className="text-[11px] text-[#6B6E6B] flex items-center justify-between pt-2 border-t border-[#FAF8F5]">
                  <span className="truncate max-w-[140px]">
                    {page.users?.email ? page.users.email.split("@")[0] : "Curator"}
                  </span>
                  <span>{new Date(page.updated_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Architectural Callout Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E9F0EC] to-[#DFECE8] border border-[#449E73]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#143325]">
            <Sparkles className="w-4 h-4 text-[#449E73]" />
            <span>Collaborative Knowledge Archive</span>
          </div>
          <p className="text-xs text-[#204D39] leading-relaxed max-w-xl">
            Bindery automatically tracks edits, preserves document ancestry, and connects institutional knowledge for your team.
          </p>
        </div>
        <Link
          href={`/workspace/${workspaceId}/members`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#143325] hover:underline underline-offset-4 shrink-0"
        >
          <span>Invite teammates</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}