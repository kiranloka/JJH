"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  FileText,
  HardDrive,
  Upload as UploadIcon,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Download as DownloadIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  DashboardSummary,
  DEFAULT_STORAGE_QUOTA_BYTES,
  DOWNLOAD_DAILY_LIMIT,
  UPLOAD_DAILY_LIMIT,
  formatBytes,
} from "@/lib/medical-records";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const data = (await response.json()) as DashboardSummary & { error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Unable to load dashboard.");
        }

        if (!cancelled) {
          setDashboard(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalRecords = dashboard?.totalRecords ?? 0;
  const uploadedThisWeek = dashboard?.uploadedThisWeek ?? 0;
  const uploadUsed = dashboard?.uploadUsage.used ?? 0;
  const uploadLimit = dashboard?.uploadLimit ?? UPLOAD_DAILY_LIMIT;
  const downloadUsed = dashboard?.downloadUsage.used ?? 0;
  const downloadLimit = dashboard?.downloadLimit ?? DOWNLOAD_DAILY_LIMIT;
  const storageUsed = dashboard?.storageUsedBytes ?? 0;
  const storageQuota = dashboard?.storageQuotaBytes ?? DEFAULT_STORAGE_QUOTA_BYTES;
  const storagePercent = storageQuota > 0 ? Math.min((storageUsed / storageQuota) * 100, 100) : 0;
  const uploadHistoryData = dashboard?.history ?? [];
  const logs = dashboard?.recentActivity ?? [];

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Medical Records Operations
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground/70" /> {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-background/50 backdrop-blur-sm border-border">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2 inline-block" />
            Supabase Storage Active
          </Badge>
        </div>
      </div>

      {error && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Total Indexed Files"
          value={isLoading ? "..." : totalRecords.toLocaleString("en-IN")}
          detail="Records currently stored in Supabase"
          icon={<FileText className="h-5 w-5 text-primary" />}
        />

        <MetricCard
          title="Uploaded This Week"
          value={isLoading ? "..." : uploadedThisWeek.toLocaleString("en-IN")}
          detail={`${uploadUsed}/${uploadLimit} uploads used today`}
          icon={<UploadIcon className="h-5 w-5 text-primary" />}
        />

        <MetricCard
          title="Downloads Today"
          value={isLoading ? "..." : `${downloadUsed}/${downloadLimit}`}
          detail="Daily download quota enforced by API"
          icon={<DownloadIcon className="h-5 w-5 text-primary" />}
        />

        <Card className="rounded-2xl shadow-sm border-border/80 bg-card/50 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Storage Capacity</p>
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{formatBytes(storageUsed)}</h3>
              <span className="text-muted-foreground text-sm font-semibold">
                / {formatBytes(storageQuota)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${storagePercent}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl shadow-sm border-border/80 bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Ingestion Pipeline Throughput</CardTitle>
            <CardDescription>Daily volume of PDFs uploaded into the records repository.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={uploadHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                  contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "12px" }}
                />
                <Bar dataKey="uploads" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/80 bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Download Quota Trend</CardTitle>
            <CardDescription>Daily download activity captured by the protected download route.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uploadHistoryData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "12px" }} />
                <Area type="monotone" dataKey="downloads" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#downloadGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm border-border/80 bg-card overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">System Activity Trail</CardTitle>
            </div>
            <Badge variant="secondary" className="font-medium text-xs">Live API Data</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-40 pl-6 font-medium text-xs uppercase tracking-wider text-muted-foreground">Timestamp</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Event Activity</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Subsystem Source</TableHead>
                <TableHead className="text-right pr-6 font-medium text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No upload activity yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => (
                  <TableRow key={`${log.time}-${index}`} className="border-border/60 hover:bg-muted/20 transition-colors">
                    <TableCell className="text-muted-foreground pl-6 font-mono text-xs">{log.time}</TableCell>
                    <TableCell className="font-medium text-foreground text-sm">{log.event}</TableCell>
                    <TableCell className="text-muted-foreground text-sm flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 opacity-60" /> {log.source}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {log.status === "success" && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5 px-2.5 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Success
                        </Badge>
                      )}
                      {log.status === "error" && (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5 px-2.5 py-0.5 rounded-full font-medium">
                          <AlertCircle className="h-3 w-3" /> System Fault
                        </Badge>
                      )}
                      {log.status === "info" && (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted px-2.5 py-0.5 rounded-full font-medium">
                          Information
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-sm border-border/80 bg-card/50 backdrop-blur-md">
      <CardContent className="p-6 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="bg-primary/10 p-2.5 rounded-xl">{icon}</div>
        </div>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        <p className="text-xs text-muted-foreground mt-2 font-medium">{detail}</p>
      </CardContent>
    </Card>
  );
}
