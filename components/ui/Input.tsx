import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  optional?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      optional = false,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <div className="flex items-center justify-between text-xs font-semibold text-[#1F2421]">
            <label htmlFor={inputId}>
              {label}{" "}
              {optional && (
                <span className="font-normal text-[#6B6E6B] text-[11px]">(Optional)</span>
              )}
            </label>
          </div>
        )}

        <div className="relative flex items-center w-full">
          {icon && (
            <span className="absolute left-3 text-[#6B6E6B] pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full h-11 px-3.5 bg-[#FAF8F5] border border-[#EAE5DC] text-[#1F2421] text-sm rounded-lg placeholder:text-[#A3AAA3] transition-all duration-150 focus:outline-none focus:bg-white focus:border-[#143325] focus:ring-1 focus:ring-[#143325] disabled:opacity-50 disabled:bg-[#F5F2EC] ${
              icon ? "pl-10" : ""
            } ${
              error
                ? "border-[#B83A3A] focus:border-[#B83A3A] focus:ring-[#B83A3A]"
                : ""
            } ${className}`}
            {...props}
          />
        </div>

        {error && <p className="text-xs text-[#B83A3A] font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[#6B6E6B] leading-relaxed">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  optional?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      optional = false,
      className = "",
      id,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <div className="flex items-center justify-between text-xs font-semibold text-[#1F2421]">
            <label htmlFor={textareaId}>
              {label}{" "}
              {optional && (
                <span className="font-normal text-[#6B6E6B] text-[11px]">(Optional)</span>
              )}
            </label>
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`w-full p-3.5 bg-[#FAF8F5] border border-[#EAE5DC] text-[#1F2421] text-sm rounded-lg placeholder:text-[#A3AAA3] transition-all duration-150 focus:outline-none focus:bg-white focus:border-[#143325] focus:ring-1 focus:ring-[#143325] disabled:opacity-50 disabled:bg-[#F5F2EC] resize-none ${
            error
              ? "border-[#B83A3A] focus:border-[#B83A3A] focus:ring-[#B83A3A]"
              : ""
          } ${className}`}
          {...props}
        />

        {error && <p className="text-xs text-[#B83A3A] font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[#6B6E6B] leading-relaxed">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
