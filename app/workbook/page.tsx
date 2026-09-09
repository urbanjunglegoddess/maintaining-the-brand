import { getBook } from "@/lib/content";
import Workbook from "@/components/Workbook";

// Phase 0: renders from the seeded JSON, no auth.
// Phase 1: wrap in an auth check + hydrate saved answers from the answers API.
// Phase 2: gate behind an entitlement (see lib/entitlement.ts in the scope).
export default function WorkbookPage() {
  const book = getBook();
  return <Workbook book={book} />;
}
