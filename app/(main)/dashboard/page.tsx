"use client";

import { useState } from "react";
import {
  FileText,
  HardDrive,
  Upload as UploadIcon,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database
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
  Area
} from "recharts";

// Mock data tracking the 200-300 daily PDF upload trajectory over the week
const uploadHistoryData = [
  { name: "Mon", uploads: 245, processingTime: 1.2 },
  { name: "Tue", uploads: 280, processingTime: 1.1 },
  { name: "Wed", uploads: 210, processingTime: 1.5 },
  { name: "Thu", uploads: 295, processingTime: 0.9 },
  { name: "Fri", uploads: 265, processingTime: 1.0 },
  { name: "Sat", uploads: 142, processingTime: 0.8 },
  { name: "Sun", uploads: 95, processingTime: 0.7 },
];

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logs = [
    { time: "2 mins ago", event: "File IP-2024-0895.pdf processed successfully", status: "success", source: "Scanner Agent" },
    { time: "15 mins ago", event: "Storage capacity reached 24%", status: "info", source: "System" },
    { time: "1 hour ago", event: "Failed to upload IP-2024-0896.pdf - Network Error", status: "error", source: "Scanner Agent" },
    { time: "3 hours ago", event: "User logged in", status: "info", source: "Dr. Sharma" },
    { time: "Yesterday", event: "Batch sync of 42 files completed", status: "success", source: "Scanner Agent" },
  ];

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header section */}
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
            ABDM Gateway Link Active
          </Badge>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-sm border-border/80 bg-card/50 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Indexed Files</p>
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="text-3xl font-bold tracking-tight">2,847</h3>
            <p className="text-xs text-muted-foreground mt-2 font-medium text-emerald-600 dark:text-emerald-400">
              +12.4% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/80 bg-card/50 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Uploaded This Week</p>
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <UploadIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="text-3xl font-bold tracking-tight">1,532</h3>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Avg. 218 documents / day
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-border/80 bg-card/50 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">S3 Storage Capacity</p>
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">1.22</h3>
              <span className="text-muted-foreground text-sm font-semibold">/ 5.0 TB Used</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: "24.4%" }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl shadow-sm border-border/80 bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Ingestion Pipeline Throughput</CardTitle>
            <CardDescription>Daily volume breakdown of incoming medical PDFs processed by your indexing layer.</CardDescription>
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
            <CardTitle className="text-base font-semibold">Parser Extraction Latency</CardTitle>
            <CardDescription>Average processing speed (seconds) of multimodal AI metadata extraction per file.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uploadHistoryData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "12px" }} />
                <Area type="monotone" dataKey="processingTime" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#latencyGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Audit Trails and System Logs */}
      <Card className="rounded-2xl shadow-sm border-border/80 bg-card overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">System Activity Trail</CardTitle>
            </div>
            <Badge variant="secondary" className="font-medium text-xs">Real-time Stream</Badge>
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
              {logs.map((log, i) => (
                <TableRow key={i} className="border-border/60 hover:bg-muted/20 transition-colors">
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
