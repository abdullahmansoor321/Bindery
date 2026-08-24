"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { getChildPages } from "@/app/actions/pages";
import { NewPageForm } from "./NewPageForm";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  GripVertical,
  Plus,
  Loader2,
} from "lucide-react";

type PageSummary = { id: string; title: string; position: number };

export function PageTreeNode({
  workspaceId,
  page,
  parentId,
  canEdit,
  depth = 0,
}: {
  workspaceId: string;
  page: PageSummary;
  parentId: string | null;
  canEdit: boolean;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<PageSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  const isActive = pathname === `/workspace/${workspaceId}/page/${page.id}`;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: page.id,
    data: { pageId: page.id, title: page.title },
    disabled: !canEdit,
  });

  const { setNodeRef: setNestDropRef, isOver: isNestOver } = useDroppable({
    id: `nest-${page.id}`,
    data: { type: "nest", targetPageId: page.id },
  });

  const { setNodeRef: setSiblingDropRef, isOver: isSiblingOver } = useDroppable({
    id: `sibling-${page.id}`,
    data: { type: "sibling", afterPageId: page.id, parentId },
  });

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    if (nextExpanded && children === null) {
      setIsLoading(true);
      try {
        const fetched = await getChildPages({ workspaceId, parentId: page.id });
        setChildren(fetched);
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <div
      style={{ paddingLeft: depth > 0 ? 12 : 0 }}
      className={`relative group ${isDragging ? "opacity-30" : "opacity-100"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Node Bar */}
      <div
        ref={setNestDropRef}
        className={`flex items-center justify-between h-7 px-1.5 rounded-lg text-xs transition-all ${
          isNestOver
            ? "bg-[#DFECE8] ring-1 ring-[#449E73]"
            : isActive
            ? "bg-[#E9F0EC] text-[#143325] font-semibold"
            : "text-[#1F2421] hover:bg-[#EAE5DC]/60"
        }`}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {/* Drag Handle */}
          {canEdit && (
            <button
              ref={setDragRef}
              {...listeners}
              {...attributes}
              className={`p-0.5 rounded text-[#A3AAA3] hover:text-[#1F2421] cursor-grab active:cursor-grabbing touch-none transition-opacity ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              title="Drag to reorder"
            >
              <GripVertical className="w-3 h-3" />
            </button>
          )}

          {/* Toggle Expand Arrow */}
          <button
            onClick={handleToggle}
            className="w-4 h-4 flex items-center justify-center text-[#6B6E6B] hover:text-[#1F2421] rounded"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#449E73]" />
            ) : isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Page Link */}
          <Link
            href={`/workspace/${workspaceId}/page/${page.id}`}
            className="flex items-center gap-1.5 truncate flex-1"
          >
            <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#143325]" : "text-[#6B6E6B]"}`} />
            <span className="truncate">{page.title}</span>
          </Link>
        </div>

        {/* Quick Add Child button on hover */}
        {canEdit && isHovered && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isExpanded) {
                handleToggle(e);
              }
            }}
            className="p-1 rounded text-[#6B6E6B] hover:text-[#143325] hover:bg-[#FAF8F5] transition-colors shrink-0"
            title="Add sub-page"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Sibling Drop Target Indicator */}
      {canEdit && (
        <div
          ref={setSiblingDropRef}
          className={`h-1 mx-2 rounded-full transition-all ${
            isSiblingOver ? "bg-[#449E73] h-1.5 my-0.5" : "bg-transparent"
          }`}
        />
      )}

      {/* Sub-tree Children */}
      {isExpanded && (
        <div className="space-y-0.5 mt-0.5">
          {children?.map((child) => (
            <PageTreeNode
              key={child.id}
              workspaceId={workspaceId}
              page={child}
              parentId={page.id}
              canEdit={canEdit}
              depth={depth + 1}
            />
          ))}

          {canEdit && (
            <div style={{ paddingLeft: (depth + 1) * 12 + 6 }} className="pt-0.5">
              <NewPageForm
                workspaceId={workspaceId}
                parentId={page.id}
                onCreated={(newPage) =>
                  setChildren((prev) => [...(prev ?? []), newPage])
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}