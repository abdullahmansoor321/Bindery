"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { togglePublic } from "@/app/actions/pages";
import { Globe, Copy, Check, Lock, Loader2 } from "lucide-react";

export function TogglePublicButton({
  pageId,
  initialIsPublic,
}: {
  pageId: string;
  initialIsPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    const next = !isPublic;
    setIsPublic(next);
    setLoading(true);
    try {
      await togglePublic({ pageId, isPublic: next });
      router.refresh();
    } catch {
      setIsPublic(!next); // rollback
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    const publicUrl = `${window.location.origin}/p/${pageId}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          isPublic
            ? "bg-[#E9F0EC] border-[#449E73]/40 text-[#143325] hover:bg-[#DFECE8]"
            : "bg-white border-[#EAE5DC] text-[#6B6E6B] hover:text-[#1F2421] hover:bg-[#F5F2EC]"
        }`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPublic ? (
          <Globe className="w-3.5 h-3.5 text-[#449E73]" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-[#6B6E6B]" />
        )}
        <span>{isPublic ? "Publicly Shared" : "Make Public"}</span>
      </button>

      {isPublic && (
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#EAE5DC] hover:bg-[#F5F2EC] text-xs font-medium text-[#1F2421] transition-colors shadow-2xs"
          title="Copy public link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-[#10B981]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#6B6E6B]" />
              <span>Copy link</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}