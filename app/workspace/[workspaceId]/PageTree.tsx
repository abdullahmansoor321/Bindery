"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { movePage } from "@/app/actions/pages";
import { PageTreeNode } from "./PageTreeNode";

type PageSummary = { id: string; title: string; position: number };

// Dedicated drop target representing "the top level itself." Dropping
// here always means newParentId: null — this is the piece that was
// missing before: a deeply nested page previously had no way to ever
// become top-level again.
function RootDropZone({ afterSiblingId }: { afterSiblingId: string | null }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "root-drop-zone",
    data: { type: "sibling", afterPageId: afterSiblingId, parentId: null },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        height: 32,
        marginTop: 8,
        border: "1px dashed #ccc",
        borderColor: isOver ? "#88f" : "#ccc",
        background: isOver ? "#eef" : "transparent",
        fontSize: 11,
        color: "#aaa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Drop here to move to top level
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

  // Unrelated to the top-level-move fix — this stays because it's
  // what stops the hydration error from earlier (DndContext can't be
  // rendered on the server).
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
      | { type: "sibling"; afterPageId: string | null; parentId: string | null };

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
      <div>
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
      <div>
        {rootPages.map((page) => (
          <PageTreeNode
            key={page.id}
            workspaceId={workspaceId}
            page={page}
            parentId={null}
            canEdit={canEdit}
          />
        ))}
      </div>

      {/* NEW: the top-level drop zone, the only actual change here */}
      {canEdit && (
        <RootDropZone
          afterSiblingId={rootPages.length > 0 ? rootPages[rootPages.length - 1].id : null}
        />
      )}

      <DragOverlay>
        {activeTitle ? (
          <div style={{ padding: "4px 8px", background: "white", border: "1px solid #ccc", borderRadius: 4 }}>
            {activeTitle}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}