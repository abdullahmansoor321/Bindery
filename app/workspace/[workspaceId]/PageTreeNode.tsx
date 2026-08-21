"use client";

import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { getChildPages } from "@/app/actions/pages";
import { NewPageForm } from "./NewPageForm";

type PageSummary = { id: string; title: string; position: number };

export function PageTreeNode({
  workspaceId,
  page,
  parentId,
  canEdit,
}: {
  workspaceId: string;
  page: PageSummary;
  parentId: string | null;
  canEdit: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<PageSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
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

  async function handleToggle() {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    if (nextExpanded && children === null) {
      setIsLoading(true);
      const fetched = await getChildPages({ workspaceId, parentId: page.id });
      setChildren(fetched);
      setIsLoading(false);
    }
  }

  return (
    <div style={{ paddingLeft: 16, opacity: isDragging ? 0.4 : 1 }}>
      <div
        ref={setNestDropRef}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: isNestOver ? "#eef" : "transparent",
        }}
      >
        {canEdit && (
          <span
            ref={setDragRef}
            {...listeners}
            {...attributes}
            style={{ cursor: "grab", color: "#aaa", fontSize: 12, touchAction: "none" }}
          >
            ⠿
          </span>
        )}

        <button onClick={handleToggle} style={{ fontSize: 12 }}>
          {isExpanded ? "▾" : "▸"}
        </button>
        <a href={`/workspace/${workspaceId}/page/${page.id}`}>{page.title}</a>
      </div>

      {canEdit && (
        <div
          ref={setSiblingDropRef}
          style={{
            height: 6,
            background: isSiblingOver ? "#88f" : "transparent",
          }}
        />
      )}

      {isExpanded && (
        <div style={{ marginTop: 4 }}>
          {isLoading && <p style={{ color: "#888", fontSize: 12 }}>Loading...</p>}

          {children?.map((child) => (
            <PageTreeNode
              key={child.id}
              workspaceId={workspaceId}
              page={child}
              parentId={page.id}
              canEdit={canEdit}
            />
          ))}

          {canEdit && (
            <div style={{ marginTop: 4 }}>
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