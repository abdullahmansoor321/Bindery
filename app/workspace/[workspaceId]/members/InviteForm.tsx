"use client";

import { useState } from "react";
import { inviteMember } from "@/app/actions/members";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { UserPlus, Check, Send } from "lucide-react";

export function InviteForm({ workspaceId }: { workspaceId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await inviteMember({ workspaceId, email: email.trim(), role });
      setSuccess(true);
      setEmail("");
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => setIsOpen(true)}
        icon={<UserPlus className="w-3.5 h-3.5" />}
      >
        Invite Teammate
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setError(null);
          setSuccess(false);
        }}
        title="Invite a Teammate"
        description="Invited members will receive an email link to join this workspace."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-[#1F2421]">
              Permission Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
              className="w-full h-11 px-3 bg-[#FAF8F5] border border-[#EAE5DC] text-xs rounded-lg text-[#1F2421] font-medium focus:outline-none focus:bg-white focus:border-[#143325] focus:ring-1 focus:ring-[#143325]"
            >
              <option value="EDITOR">Editor — Can view, create, and edit documents</option>
              <option value="VIEWER">Viewer — Read-only access to all workspace pages</option>
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B83A3A] font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#10B981] font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Invitation sent successfully!</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE5DC]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              disabled={!email.trim() || success}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}