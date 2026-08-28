import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "role-owner" | "role-editor" | "role-viewer" | "public" | "private" | "neutral" | "success" | "warning";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  size = "sm",
  className = "",
}: BadgeProps) {
  const sizes = {
    sm: "text-[11px] px-2 py-0.5 font-semibold",
    md: "text-xs px-2.5 py-1 font-semibold",
  };

  const variants = {
    "role-owner": "bg-[#143325] text-[#FAF8F5]",
    "role-editor": "bg-[#E9F0EC] text-[#143325] border border-[#DFECE8]",
    "role-viewer": "bg-[#F5F2EC] text-[#6B6E6B] border border-[#EAE5DC]",
    public: "bg-[#DFECE8] text-[#143325] border border-[#449E73]/30",
    private: "bg-[#F5F2EC] text-[#6B6E6B]",
    neutral: "bg-[#F5F2EC] text-[#1F2421] border border-[#EAE5DC]",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md tracking-wider uppercase select-none ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
