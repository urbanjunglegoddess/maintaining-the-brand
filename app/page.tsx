import { redirect } from "next/navigation";

// Phase 0: land straight in the workbook.
// Phase 4: this becomes the public marketing / sales page; the workbook moves behind auth.
export default function Home() {
  redirect("/workbook");
}
