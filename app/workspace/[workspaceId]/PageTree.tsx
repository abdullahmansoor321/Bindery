"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { movePage } from "@/app/actions/pages";
import { PageTreeNode } from "./PageTreeNode";
import { FileText } from "lucide-react";

type PageSummary = { id: string; title: string; position: number };

function RootDropZone({ afterSiblingId }: { afterSiblingId: string | null }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root-drop-zone",
    data: { type: "sibling", afterPageId: afterSiblingId, parentId: null },
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-7 mt-1.5 border border-dashed rounded-lg text-[11px] font-medium flex items-center justify-center transition-all ${
        isOver
          ? "border-[#449E73] bg-[#E9F0EC] text-[#143325]"
          : "border-[#D1C9BC] text-[#A3AAA3] hover:border-[#143325]/40"
      }`}
    >
      Move to top level
    </div>
  );
}

export function PageTree({
  workspaceId,
  rootPages,
  canEdit,
}: {
  workspaceId: string;
  rootPages: PageSummary[];
  canEdit: boolean;
}) {
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setActiveTitle(event.active.data.current?.title ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTitle(null);

    const { active, over } = event;
    if (!over) return;

    const draggedPageId = active.data.current?.pageId as string;
    const dropData = over.data.current as
      | { type: "nest"; targetPageId: string }
      | {
          type: "sibling";
          afterPageId: string | null;
          parentId: string | null;
        };

    if (draggedPageId === undefined || dropData === undefined) return;

    if (dropData.type === "nest") {
      if (draggedPageId === dropData.targetPageId) return;
      await movePage({
        pageId: draggedPageId,
        newParentId: dropData.targetPageId,
        afterSiblingId: null,
      });
    } else {
      if (draggedPageId === dropData.afterPageId) return;
      await movePage({
        pageId: draggedPageId,
        newParentId: dropData.parentId,
        afterSiblingId: dropData.afterPageId,
      });
    }

    router.refresh();
  }

  if (!isMounted) {
    return (
      <div className="space-y-0.5">
        {rootPages.map((page) => (
          <PageTreeNode
            key={page.id}
            workspaceId={workspaceId}
            page={page}
            parentId={null}
            canEdit={false}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-0.5">
        {rootPages.length === 0 ? (
          <p className="text-[11px] text-[#A3AAA3] px-2 py-3 text-center italic">
            No pages created yet.
          </p>
        ) : (
          rootPages.map((page) => (
            <PageTreeNode
              key={page.id}
              workspaceId={workspaceId}
              page={page}
              parentId={null}
              canEdit={canEdit}
            />
          ))
        )}
      </div>

      {canEdit && rootPages.length > 0 && (
        <RootDropZone
          afterSiblingId={rootPages[rootPages.length - 1].id}
        />
      )}

      <DragOverlay>
        {activeTitle ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#143325] text-[#143325] rounded-lg shadow-lg text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>{activeTitle}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}