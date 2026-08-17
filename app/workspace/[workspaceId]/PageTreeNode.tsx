"use client";

import { useState } from "react";
import { getChildPages } from "@/app/actions/pages";
import { NewPageForm } from "./NewPageForm";

type PageSummary = { id: string; title: string; position: number };

export function PageTreeNode({
  workspaceId,
  page,
  canEdit,
}: {
  workspaceId: string;
  page: PageSummary;
  canEdit: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<PageSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    // The actual lazy-loading moment: children are only fetched the
    // FIRST time this node is expanded. `children === null` means
    // "never fetched yet"; an empty array (children.length === 0)
    // correctly means "fetched once, genuinely has no children" —
    // these are deliberately different states, so we don't re-fetch
    // every single time someone toggles the same node open/closed.
    if (nextExpanded && children === null) {
      setIsLoading(true);
      const fetched = await getChildPages({ workspaceId, parentId: page.id });
      setChildren(fetched);
      setIsLoading(false);
    }
  }

  return (
    <div style={{ paddingLeft: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={handleToggle} style={{ fontSize: 12 }}>
          {isExpanded ? "▾" : "▸"}
        </button>
        <a href={`/workspace/${workspaceId}/page/${page.id}`}>{page.title}</a>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 4 }}>
          {isLoading && <p style={{ color: "#888", fontSize: 12 }}>Loading...</p>}

          {children?.map((child) => (
            <PageTreeNode
              key={child.id}
              workspaceId={workspaceId}
              page={child}
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