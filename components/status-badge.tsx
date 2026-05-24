import { Badge } from "@/components/ui/badge";

export type StatusType = "Synced" | "Uploading" | "Failed";

export function StatusBadge({ status }: { status: StatusType }) {
  const variants = {
    Synced: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30",
    Uploading: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30",
    Failed: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30",
  };

  return (
    <Badge variant="outline" className={`border-transparent font-medium ${variants[status]}`}>
      {status === "Uploading" && (
        <span className="mr-1.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      )}
      {status}
    </Badge>
  );
}
