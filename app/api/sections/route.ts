import { DEFAULT_SECTION_CATALOG, SectionSummary } from "@/lib/medical-records";
import { handleRouteError } from "@/lib/server/api";
import { listRecords } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await listRecords({ limit: 5000 });
    const counts = new Map<string, number>();

    for (const record of records) {
      for (const section of record.sections) {
        counts.set(section, (counts.get(section) ?? 0) + 1);
      }
    }

    const sections: SectionSummary[] = DEFAULT_SECTION_CATALOG.map((section) => ({
      ...section,
      recordsCount: counts.get(section.name) ?? 0,
    }));
    const knownSections = new Set<string>(DEFAULT_SECTION_CATALOG.map((section) => section.name));

    for (const [name, recordsCount] of counts) {
      if (!knownSections.has(name)) {
        sections.push({
          id: slugify(name),
          name,
          iconName: "FolderOpen",
          description: "Records assigned to this custom hospital section.",
          recordsCount,
        });
      }
    }

    return Response.json({ sections });
  } catch (error) {
    return handleRouteError(error);
  }
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}
