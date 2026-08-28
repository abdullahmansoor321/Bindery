import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { CreateWorkspaceForm } from "./CreateWorkspaceForm";
import { ArrowRight, BookOpen, Layers, Plus } from "lucide-react";

import { signOut } from "@/app/actions/auth";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const memberships = await prisma.memberships.findMany({
    where: { user_id: user.id },
    include: {
      workspaces: {
        include: {
          _count: {
            select: { pages: true, memberships: true },
          },
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-[#EAE5DC] bg-white/80 backdrop-blur-sm px-6 sm:px-12 flex items-center justify-between sticky top-0 z-20">
        <Logo size="md" />

        <div className="flex items-center gap-4">
          <span className="text-xs text-[#6B6E6B] font-mono hidden sm:inline-block">
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs font-medium text-[#6B6E6B] hover:text-[#1F2421] px-3 py-1.5 rounded-lg border border-[#EAE5DC] hover:bg-[#F5F2EC] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-12 space-y-12">
        {/* Banner */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#204D39]">
            <Layers className="w-4 h-4" />
            <span>Workspaces Canvas</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1F2421]">
            Your Workspaces
          </h1>
          <p className="text-sm text-[#6B6E6B] max-w-xl leading-relaxed">
            Select an institutional archive to continue editing or create a new dedicated space for your team.
          </p>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.map((m) => (
            <Link
              key={m.id}
              href={`/workspace/${m.workspace_id}`}
              className="group relative bg-white border border-[#EAE5DC] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#204D39]/40 transition-all duration-200 flex flex-col justify-between h-48"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#E9F0EC] flex items-center justify-center text-[#143325] group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <Badge
                    variant={
                      m.role === "OWNER"
                        ? "role-owner"
                        : m.role === "EDITOR"
                        ? "role-editor"
                        : "role-viewer"
                    }
                  >
                    {m.role}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-serif text-xl font-semibold text-[#1F2421] group-hover:text-[#143325] transition-colors line-clamp-1">
                    {m.workspaces.name}
                  </h3>
                  <p className="text-xs text-[#6B6E6B] mt-1">
                    {m.workspaces._count.pages} {m.workspaces._count.pages === 1 ? "page" : "pages"} ·{" "}
                    {m.workspaces._count.memberships} {m.workspaces._count.memberships === 1 ? "member" : "members"}
                  </p>
                </div>
              </div>

              <div className="flex items-center text-xs font-semibold text-[#143325] group-hover:translate-x-1 transition-transform">
                <span>Enter workspace</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </div>
            </Link>
          ))}

          {/* Quick Create Card */}
          <div className="bg-[#F5F2EC]/60 border border-dashed border-[#D1C9BC] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#143325]">
                <Plus className="w-4 h-4" />
                <span>New Workspace</span>
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#1F2421] mt-2">
                Create institutional space
              </h3>
            </div>
            <CreateWorkspaceForm />
          </div>
        </div>
      </main>
    </div>
  );
}