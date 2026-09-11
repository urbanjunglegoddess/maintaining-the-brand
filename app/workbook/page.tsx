import { getBook } from "@/lib/content";
import { getViewer } from "@/lib/auth";
import { hasFullAccess } from "@/lib/entitlement";
import { bookForViewer, FREE_SECTIONS } from "@/lib/preview";
import { runtimeMode } from "@/lib/config";
import Workbook from "@/components/Workbook";

/**
 * The workbook. Rendered per-request because what it contains depends on who
 * is asking: the gating happens here, on the server, before any paid content
 * is serialized into the page.
 */
export const dynamic = "force-dynamic";

export default async function WorkbookPage({
  searchParams,
}: {
  searchParams: Promise<{ signedin?: string }>;
}) {
  const { signedin } = await searchParams;

  const [book, viewer] = await Promise.all([getBook(), getViewer()]);
  const full = await hasFullAccess(viewer);
  const visible = bookForViewer(book, full);

  const totalSections = book.parts.reduce((n, p) => n + p.sections.length, 0);

  return (
    <Workbook
      book={visible}
      mode={runtimeMode(Boolean(viewer))}
      email={viewer?.email ?? null}
      fullAccess={full}
      lockedCount={totalSections - FREE_SECTIONS.length}
      justSignedIn={signedin === "1"}
    />
  );
}
