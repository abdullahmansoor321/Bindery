"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { createWorkspace } from "@/app/actions/workspace";
import { inviteMember } from "@/app/actions/members";
import { Plus, Trash2, ArrowRight, Check } from "lucide-react";

interface InviteRow {
  email: string;
  role: "EDITOR" | "VIEWER";
}

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null);
  
  // Step 2 Invites
  const [invites, setInvites] = useState<InviteRow[]>([
    { email: "", role: "EDITOR" },
    { email: "", role: "VIEWER" },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const ws = await createWorkspace({ name: workspaceName.trim() });
      setCreatedWorkspaceId(ws.id);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleAddInviteRow = () => {
    setInvites([...invites, { email: "", role: "EDITOR" }]);
  };

  const handleRemoveInviteRow = (index: number) => {
    if (invites.length <= 1) return;
    setInvites(invites.filter((_, i) => i !== index));
  };

  const handleUpdateInvite = (
    index: number,
    field: "email" | "role",
    val: string
  ) => {
    const updated = [...invites];
    if (field === "email") {
      updated[index].email = val;
    } else {
      updated[index].role = val as "EDITOR" | "VIEWER";
    }
    setInvites(updated);
  };

  const handleFinishOnboarding = async () => {
    if (!createdWorkspaceId) return;

    setLoading(true);
    setError(null);

    const validInvites = invites.filter((inv) => inv.email.trim().length > 0);
    try {
      for (const inv of validInvites) {
        try {
          await inviteMember({
            workspaceId: createdWorkspaceId,
            email: inv.email.trim(),
            role: inv.role,
          });
        } catch {
          // Continue if single invite fails
        }
      }
      router.push(`/workspace/${createdWorkspaceId}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error sending invites");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-[#0B1C14]">
      {/* Figma Bookbinding Background Image */}
      <Image
        src={
          step === 1
            ? "/images/onboarding-step1-bg.png"
            : "/images/onboarding-step2-bg.png"
        }
        alt="Onboarding Background"
        fill
        priority
        className="object-cover object-center"
      />

      {/* Figma Dark Gradient Overlay: linear-gradient(135deg, rgba(11, 28, 20, 0.98) 0%, rgba(20, 51, 37, 0.98) 65%, rgba(3, 10, 7, 1) 100%) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(11, 28, 20, 0.96) 0%, rgba(20, 51, 37, 0.96) 65%, rgba(3, 10, 7, 0.98) 100%)",
        }}
      />

      {/* Floating Centered Onboarding Card (Figma 04 Specification) */}
      <div className="relative w-full max-w-[540px] bg-white border border-[#EAE5DC] rounded-3xl p-8 sm:p-12 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header with Logo & Step Indicator */}
        <div className="flex items-center justify-between pb-8 border-b border-[#EAE5DC]">
          <Logo size="md" />

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-bold tracking-wider text-[#204D39] uppercase">
              STEP {step} OF 2
            </span>
            <div className="flex gap-1">
              <div
                className={`w-4 h-1 rounded-full transition-all duration-300 ${
                  step >= 1 ? "bg-[#143325]" : "bg-[#EAE5DC]"
                }`}
              />
              <div
                className={`w-4 h-1 rounded-full transition-all duration-300 ${
                  step === 2 ? "bg-[#143325]" : "bg-[#EAE5DC]"
                }`}
              />
            </div>
          </div>
        </div>

        {/* STEP 1: CREATE WORKSPACE */}
        {step === 1 && (
          <form onSubmit={handleCreateWorkspace} className="space-y-6 pt-8">
            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1F2421]">
                Create your workspace
              </h2>
              <p className="text-sm text-[#6B6E6B] leading-relaxed">
                A workspace is a dedicated institutional canvas where your team
                creates, curates, and uncovers shared knowledge.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <Input
                label="Workspace Name"
                placeholder="e.g. Verdant Lands, Research Lab"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
                autoFocus
              />

              <Textarea
                label="Description"
                optional
                placeholder="The central repository for our projects, technical documentation, and archives."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B83A3A] font-medium">
                {error}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Continue to Step 2
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: INVITE TEAMMATES */}
        {step === 2 && (
          <div className="space-y-6 pt-8">
            <div className="space-y-2">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1F2421]">
                Invite your team
              </h2>
              <p className="text-sm text-[#6B6E6B] leading-relaxed">
                Knowledge thrives when it is communally shared. Invite your core
                curators to build this archive together.
              </p>
            </div>

            {/* Dynamic Invites List */}
            <div className="space-y-3 pt-2 max-h-60 overflow-y-auto pr-1">
              {invites.map((inv, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="teammate@company.com"
                    value={inv.email}
                    onChange={(e) =>
                      handleUpdateInvite(idx, "email", e.target.value)
                    }
                    className="flex-1 h-10 px-3 bg-[#FAF8F5] border border-[#EAE5DC] text-xs rounded-lg placeholder:text-[#A3AAA3] focus:outline-none focus:bg-white focus:border-[#143325] focus:ring-1 focus:ring-[#143325]"
                  />
                  <select
                    value={inv.role}
                    onChange={(e) =>
                      handleUpdateInvite(idx, "role", e.target.value)
                    }
                    className="h-10 px-3 bg-[#FAF8F5] border border-[#EAE5DC] text-xs rounded-lg text-[#1F2421] font-medium focus:outline-none focus:bg-white focus:border-[#143325]"
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  {invites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInviteRow(idx)}
                      className="p-2 text-[#A3AAA3] hover:text-[#B83A3A] transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddInviteRow}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#143325] hover:text-[#204D39] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another teammate</span>
            </button>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B83A3A] font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                loading={loading}
                onClick={handleFinishOnboarding}
                className="w-full"
                icon={<Check className="w-4 h-4" />}
                iconPosition="right"
              >
                Finish & Open Workspace
              </Button>

              <button
                type="button"
                onClick={() => {
                  if (createdWorkspaceId) {
                    router.push(`/workspace/${createdWorkspaceId}`);
                    router.refresh();
                  }
                }}
                className="w-full py-2 text-xs font-medium text-[#6B6E6B] hover:text-[#1F2421] transition-colors text-center"
              >
                Skip invitation for now &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
