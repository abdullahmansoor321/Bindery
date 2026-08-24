import React from "react";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark" | "inverted";
  showWordmark?: boolean;
  href?: string;
  className?: string;
}

export function Logo({
  size = "md",
  variant = "light",
  showWordmark = true,
  href = "/",
  className = "",
}: LogoProps) {
  const leafSizes = {
    sm: "w-3 h-4",
    md: "w-4 h-6",
    lg: "w-6 h-8",
  };

  const textSizes = {
    sm: "text-base tracking-wider",
    md: "text-xl tracking-widest",
    lg: "text-2xl tracking-widest",
  };

  const emblemColors = {
    light: "bg-[#143325]",
    dark: "bg-[#449E73]",
    inverted: "bg-[#FAF8F5]",
  };

  const textColors = {
    light: "text-[#1F2421]",
    dark: "text-[#F5F2EB]",
    inverted: "text-[#FAF8F5]",
  };

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Dual-leaf Emblem from Figma */}
      <div className="flex items-center -space-x-1">
        <div
          className={`${leafSizes[size]} ${emblemColors[variant]} opacity-85 rounded-tl-[12px] rounded-br-[12px] rounded-tr-none rounded-bl-none transition-transform duration-200 hover:rotate-3`}
        />
        <div
          className={`${leafSizes[size]} ${emblemColors[variant]} rounded-tr-[12px] rounded-bl-[12px] rounded-tl-none rounded-br-none transition-transform duration-200 hover:-rotate-3`}
        />
      </div>

      {showWordmark && (
        <span
          className={`font-serif font-black ${textSizes[size]} ${textColors[variant]} uppercase leading-none pt-0.5`}
        >
          BINDERY
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
