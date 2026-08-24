"use client";

import { useState } from "react";
import { removeMember } from "@/app/actions/members";
import { UserMinus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function RemoveMemberButton({
  workspaceId,
  membershipId,
  memberName,
}: {
  workspaceId: string;
  membershipId: string;
  memberName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    setLoading(true);
    setError(null);
    try {
      await removeMember({ workspaceId, membershipId });
      setIsOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg text-[#A3AAA3] hover:text-[#B83A3A] hover:bg-red-50 transition-colors"
        title="Remove member"
      >
        <UserMinus className="w-4 h-4" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Remove Team Member"
        description="Are you sure you want to remove this member from the workspace?"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#6B6E6B] leading-relaxed">
            <span className="font-semibold text-[#1F2421]">
              {memberName || "This user"}
            </span>{" "}
            will lose all access to pages and documents within this workspace immediately.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B83A3A] font-medium">
              {error}
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
              type="button"
              variant="danger"
              size="sm"
              onClick={handleRemove}
              loading={loading}
              icon={<UserMinus className="w-3.5 h-3.5" />}
            >
              Remove Member
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}