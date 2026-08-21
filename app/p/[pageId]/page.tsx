import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

// NO auth check anywhere in this file — this route is exempted in
// proxy.ts's isPublicRoute list (/p/ prefix), reachable by anyone
// with the link, no session required at all.
export default async function PublicPageView({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;

  // The single most important line in this file, per FR-4.3: the
  // query itself enforces "only this one page, only if it's actually
  // public" — there is no separate "check permission" step here,
  // because the WHERE clause IS the permission check. If is_public
  // is false, this returns null no matter who's asking or why.
  const page = await prisma.pages.findFirst({
    where: { id: pageId, is_public: true },
  });

  if (!page) {
    // Deliberately identical whether the page doesn't exist, was
    // never public, or had sharing turned off after being shared —
    // we never reveal WHICH of those is true to an outside visitor.
    notFound();
  }

  const contentText =
    typeof page.content === "object" && page.content !== null && "text" in page.content
      ? String((page.content as { text: unknown }).text)
      : "";

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      {/* No sidebar, no breadcrumb, no workspace chrome, no login
          prompt — just this one page's content, per FR-4.3. Note
          there's also deliberately no link to siblings/children
          anywhere on this page. */}
      <p style={{ fontSize: 12, color: "#888" }}>Bindery</p>
      <h1>{page.title}</h1>
      <p style={{ whiteSpace: "pre-wrap" }}>{contentText}</p>
    </div>
  );
}