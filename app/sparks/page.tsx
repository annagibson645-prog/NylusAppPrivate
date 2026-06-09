// app/sparks/page.tsx — the Sparks list page.
// Promoted to the "Illuminated Index" layout (renders the same component as the
// /sparks/sp3 prototype). To switch to a different prototype, change the import
// below to "./sp1/page" … "./sp6/page".
import SparksList from "./sp3/page";

export const dynamic = "force-static";

export default function SparksPage() {
  return <SparksList />;
}
