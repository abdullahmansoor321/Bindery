"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageTree } from "./PageTree";
import { NewPageForm } from "./NewPageForm";
import {
  Home,
  Users,
  Settings,
  Plus,
  Search,
  Sparkles,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";

type PageSummary = { id: string; title: string; position: number };
type WorkspaceSummary = { id: string; name: string };

interface SidebarProps {
  workspace: {
    id: string;
    name: string;
  };
  otherWorkspaces: WorkspaceSummary[];
  rootPages: PageSummary[];
  canEdit: boolean;
  userEmail: string;
  userRole: string;
}

export function Sidebar({
  workspace,
  otherWorkspaces,
  rootPages,
  canEdit,
  userEmail,
  userRole,
}: SidebarProps) {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isNewRootOpen, setIsNewRootOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === `/workspace/${workspace.id}`;
  const isMembers = pathname === `/workspace/${workspace.id}/members`;
  const isSettings = pathname === `/workspace/${workspace.id}/settings`;

  return (
    <aside className="w-[280px] bg-[#F5F2EC] border-r border-[#EAE5DC] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none overflow-hidden text-[#1F2421]">
      {/* Top Header & Workspace Switcher */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Workspace Switcher Header */}
        <div className="p-3.5 border-b border-[#EAE5DC] relative">
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#EAE5DC]/60 transition-colors text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#143325] flex items-center justify-center text-[#FAF8F5] shrink-0 font-serif font-bold text-sm">
                {workspace.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif font-semibold text-sm text-[#1F2421] truncate leading-tight">
                  {workspace.name}
                </h2>
                <span className="text-[11px] text-[#6B6E6B] font-mono capitalize">
                  {userRole.toLowerCase()}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-[#6B6E6B] group-hover:text-[#1F2421] shrink-0 ml-1" />
          </button>

          {/* Switcher Dropdown Menu */}
          {isSwitcherOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsSwitcherOpen(false)}
              />
              <div className="absolute top-16 left-3 right-3 bg-white border border-[#EAE5DC] rounded-xl shadow-xl z-40 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A3AAA3]">
                  Workspaces
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#E9F0EC] text-[#143325] text-xs font-semibold flex items-center justify-between">
                    <span className="truncate">{workspace.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#143325]" />
                  </div>
                  {otherWorkspaces.map((ow) => (
                    <Link
                      key={ow.id}
                      href={`/workspace/${ow.id}`}
                      onClick={() => setIsSwitcherOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg hover:bg-[#F5F2EC] text-[#1F2421] text-xs font-medium flex items-center justify-between transition-colors truncate"
                    >
                      <span className="truncate">{ow.name}</span>
                    </Link>
                  ))}
                </div>
                <div className="pt-1 border-t border-[#EAE5DC]">
                  <Link
                    href="/workspace/onboarding"
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#F5F2EC] text-[#143325] text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create workspace</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Global Quick Action Buttons (Search & Ask Wiki) */}
        <div className="p-3 space-y-1 border-b border-[#EAE5DC]">
          <button
            onClick={() => {
              // Quick alert for placeholder search
              alert("Global Search (⌘K) will be available in the upcoming Search update!");
            }}
            className="w-full h-8 px-2.5 rounded-lg bg-white/70 hover:bg-white border border-[#EAE5DC] flex items-center justify-between text-xs text-[#6B6E6B] hover:text-[#1F2421] transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#6B6E6B]" />
              <span>Search knowledge...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#FAF8F5] border border-[#EAE5DC] rounded text-[#6B6E6B]">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => {
              alert("Ask the Wiki (AI Q&A) vector streaming will be connected in the upcoming AI release!");
            }}
            className="w-full h-8 px-2.5 rounded-lg bg-gradient-to-r from-[#DFECE8]/60 to-[#E9F0EC]/60 hover:from-[#DFECE8] hover:to-[#E9F0EC] border border-[#449E73]/20 flex items-center justify-between text-xs font-medium text-[#143325] transition-all"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#449E73]" />
              <span>Ask the Wiki</span>
            </div>
            <span className="text-[10px] font-mono px-1 rounded bg-[#449E73]/15 text-[#143325]">
              AI
            </span>
          </button>
        </div>

        {/* Primary Navigation Links */}
        <div className="px-3 pt-2 pb-1 space-y-0.5 text-xs">
          <Link
            href={`/workspace/${workspace.id}`}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              isHome
                ? "bg-[#E9F0EC] text-[#143325] font-semibold"
                : "text-[#6B6E6B] hover:bg-[#EAE5DC]/50 hover:text-[#1F2421]"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Workspace Home</span>
          </Link>
          <Link
            href={`/workspace/${workspace.id}/members`}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              isMembers
                ? "bg-[#E9F0EC] text-[#143325] font-semibold"
                : "text-[#6B6E6B] hover:bg-[#EAE5DC]/50 hover:text-[#1F2421]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members & Roles</span>
          </Link>
          <Link
            href={`/workspace/${workspace.id}/settings`}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              isSettings
                ? "bg-[#E9F0EC] text-[#143325] font-semibold"
                : "text-[#6B6E6B] hover:bg-[#EAE5DC]/50 hover:text-[#1F2421]"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </div>

        {/* Documents Tree Section */}
        <div className="flex-1 flex flex-col min-h-0 pt-3 px-3">
          <div className="flex items-center justify-between pb-1.5 px-1">
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#A3AAA3] uppercase">
              Documents
            </span>
            {canEdit && (
              <button
                onClick={() => setIsNewRootOpen(!isNewRootOpen)}
                className="p-1 rounded hover:bg-[#EAE5DC] text-[#6B6E6B] hover:text-[#1F2421] transition-colors"
                title="New top-level page"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* New Top-Level Page Input */}
          {isNewRootOpen && (
            <div className="pb-2">
              <NewPageForm
                workspaceId={workspace.id}
                parentId={null}
                onCreated={() => setIsNewRootOpen(false)}
              />
            </div>
          )}

          {/* Scrollable Document Tree */}
          <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-0.5 text-xs">
            <PageTree
              workspaceId={workspace.id}
              rootPages={rootPages}
              canEdit={canEdit}
            />
          </div>
        </div>
      </div>

      {/* Footer User Profile Card */}
      <div className="p-3 border-t border-[#EAE5DC] bg-[#EFECE5]/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#143325] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[#1F2421] truncate text-xs">
              {userEmail.split("@")[0]}
            </p>
            <p className="text-[10px] text-[#6B6E6B] truncate font-mono">
              {userEmail}
            </p>
          </div>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            title="Sign out"
            className="p-1.5 rounded-lg text-[#6B6E6B] hover:text-[#B83A3A] hover:bg-[#FAF8F5] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
