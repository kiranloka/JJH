"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Brain,
  Baby,
  Bone,
  Dna,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionSummary } from "@/lib/medical-records";

const iconMap = {
  Heart,
  Brain,
  Baby,
  Bone,
  Dna,
  FolderOpen,
};

type SectionsResponse = {
  sections?: SectionSummary[];
  error?: string;
};

export default function SectionsPage() {
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSections() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sections", { cache: "no-store" });
        const data = (await response.json()) as SectionsResponse;

        if (!response.ok) {
          throw new Error(data.error || "Unable to load sections.");
        }

        if (!cancelled) {
          setSections(data.sections ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load sections.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSections();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Hospital Sections</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse patient medical records categorized by department and specialized care units.
        </p>
      </div>

      {isLoading ? (
        <Card className="rounded-2xl border-border bg-card p-8 text-center text-muted-foreground">
          Loading section counts from Supabase...
        </Card>
      ) : error ? (
        <Card className="rounded-2xl border-border bg-card p-8 text-center text-destructive">
          {error}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sections.map((section) => {
            const Icon = iconMap[section.iconName as keyof typeof iconMap] ?? FolderOpen;

            return (
              <Link
                key={section.id}
                href={`/records?sections=${encodeURIComponent(section.name)}`}
                className="group block h-full"
              >
                <Card
                  size="sm"
                  className="h-full flex flex-col justify-between transition-all duration-200 hover:ring-primary/40 hover:bg-accent/5"
                >
                  <CardHeader className="pb-2.5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200">
                          <Icon className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
                          {section.name}
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-medium border-border/60 bg-background/50 text-muted-foreground shrink-0">
                        {section.recordsCount} {section.recordsCount === 1 ? "Record" : "Records"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-2">
                      {section.description}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="flex items-center justify-between text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors pt-2.5">
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="h-3.5 w-3.5" />
                      View Records
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200" />
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
