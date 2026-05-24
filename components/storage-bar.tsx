import { Progress } from "@/components/ui/progress";

export function StorageBar() {
  // 1.2 TB of 5 TB is 24%
  return (
    <div className="space-y-3 w-full">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">Storage usage</span>
        <span className="text-zinc-500 dark:text-zinc-400">1.2 TB / 5 TB</span>
      </div>
      <Progress value={24} className="h-3 bg-zinc-100 dark:bg-zinc-800" />
      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>0</span>
        <span>2.5 TB</span>
        <span>5 TB</span>
      </div>
    </div>
  );
}
