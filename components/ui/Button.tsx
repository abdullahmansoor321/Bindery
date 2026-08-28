import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#143325] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizes = {
    sm: "text-xs px-3 py-1.5 rounded-md gap-1.5 h-8",
    md: "text-sm px-4 py-2 rounded-lg gap-2 h-10",
    lg: "text-base px-6 py-3 rounded-xl gap-2.5 h-12",
  };

  const variants = {
    primary:
      "bg-[#143325] hover:bg-[#204D39] text-[#FAF8F5] shadow-sm hover:shadow active:bg-[#0E241A]",
    secondary:
      "bg-[#E9F0EC] hover:bg-[#DFECE8] text-[#143325] border border-transparent active:bg-[#D4E4DE]",
    outline:
      "bg-transparent hover:bg-[#F5F2EC] text-[#1F2421] border border-[#EAE5DC] hover:border-[#D1C9BC]",
    ghost:
      "bg-transparent hover:bg-[#F5F2EC] text-[#6B6E6B] hover:text-[#1F2421]",
    danger:
      "bg-[#B83A3A] hover:bg-[#9B2F2F] text-white shadow-sm focus:ring-[#B83A3A]",
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
}
