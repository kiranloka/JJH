"use client";

import {
  CloudUpload,
  CheckCircle2,
  X,
  AlertCircle,
  FolderOpen,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { type DragEvent, type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  DOWNLOAD_DAILY_LIMIT,
  DashboardSummary,
  MAX_UPLOAD_SIZE_BYTES,
  MedicalRecord,
  UPLOAD_DAILY_LIMIT,
  formatBytes,
  formatDateInputValue,
  normalizeSections,
} from "@/lib/medical-records";

type UploadResponse = {
  record?: MedicalRecord;
  error?: string;
  details?: unknown;
};

type QueueStatus = "waiting" | "uploading" | "synced" | "failed";

type QueueItem = {
  id: string;
  name: string;
  size: number;
  status: QueueStatus;
  message?: string;
};

const directoryInputAttributes = {
  webkitdirectory: "",
  directory: "",
};

export default function UploadPage() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [syncDate, setSyncDate] = useState(formatDateInputValue());
  const [metadata, setMetadata] = useState({
    recordDate: formatDateInputValue(),
    ipNumber: "",
    patientName: "",
    doctorName: "",
    sections: "",
  });
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const uploadUsed = dashboard?.uploadUsage.used ?? 0;
  const downloadUsed = dashboard?.downloadUsage.used ?? 0;
  const uploadLimit = dashboard?.uploadLimit ?? UPLOAD_DAILY_LIMIT;
  const downloadLimit = dashboard?.downloadLimit ?? DOWNLOAD_DAILY_LIMIT;
  const remainingUploads = Math.max(uploadLimit - uploadUsed, 0);

  const filesForSyncDate = useMemo(
    () =>
      folderFiles.filter(
        (file) =>
          isPdf(file) && formatDateInputValue(new Date(file.lastModified)) === syncDate
      ),
    [folderFiles, syncDate]
  );

  useEffect(() => {
    refreshDashboard();
  }, []);

  const updateQueueItem = (id: string, patch: Partial<QueueItem>) => {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const handleManualUpload = () => {
    if (!manualFile) {
      setMessage("Select a PDF before uploading.");
      return;
    }

    startUploadTransition(async () => {
      const queueId = crypto.randomUUID();
      setMessage(null);
      setQueue((current) => [
        { id: queueId, name: manualFile.name, size: manualFile.size, status: "waiting" },
        ...current,
      ]);

      try {
        await uploadFile(manualFile, "manual", metadata.recordDate, queueId);
        setManualFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        await refreshDashboard();
      } catch (error) {
        updateQueueItem(queueId, {
          status: "failed",
          message: error instanceof Error ? error.message : "Upload failed.",
        });
      }
    });
  };

  const handleFolderSync = () => {
    if (filesForSyncDate.length === 0) {
      setMessage("No PDFs in the selected folder match the selected day.");
      return;
    }

    if (remainingUploads <= 0) {
      setMessage("Daily upload limit reached. Try again tomorrow.");
      return;
    }

    startUploadTransition(async () => {
      setMessage(null);
      const filesToUpload = filesForSyncDate.slice(0, remainingUploads);

      if (filesForSyncDate.length > remainingUploads) {
        setMessage(
          `Only ${remainingUploads} of ${filesForSyncDate.length} matching PDFs will upload because of the daily limit.`
        );
      }

      for (const file of filesToUpload) {
        const queueId = crypto.randomUUID();
        setQueue((current) => [
          { id: queueId, name: file.name, size: file.size, status: "waiting" },
          ...current,
        ]);

        try {
          await uploadFile(file, "folder-sync", syncDate, queueId);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Upload failed.";
          updateQueueItem(queueId, { status: "failed", message: errorMessage });

          if (errorMessage.toLowerCase().includes("limit")) {
            break;
          }
        }
      }

      await refreshDashboard();
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    const file = Array.from(event.dataTransfer.files).find(isPdf);

    if (file) {
      setManualFile(file);
    } else {
      setMessage("Drop a PDF file to upload.");
    }
  };

  async function uploadFile(
    file: File,
    source: "manual" | "folder-sync",
    recordDate: string,
    queueId: string
  ) {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error("File exceeds the 50MB upload limit.");
    }

    updateQueueItem(queueId, { status: "uploading" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", source);
    formData.append("recordDate", recordDate);
    formData.append("ipNumber", metadata.ipNumber);
    formData.append("patientName", metadata.patientName);
    formData.append("doctorName", metadata.doctorName);
    formData.append("sections", JSON.stringify(normalizeSections(metadata.sections)));

    const response = await fetch("/api/records/upload", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as UploadResponse;

    if (!response.ok || !data.record) {
      throw new Error(data.error || "Upload failed.");
    }

    updateQueueItem(queueId, { status: "synced", message: data.record.id });
  }

  async function refreshDashboard() {
    setDashboardError(null);

    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const data = (await response.json()) as DashboardSummary & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to load usage limits.");
      }

      setDashboard(data);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Unable to load usage limits.");
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-8">
      <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Upload Records</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Manually upload PDFs or sync files from a selected folder for one day.
          </p>
        </div>
        <Button variant="outline" onClick={refreshDashboard} className="self-start lg:self-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh limits
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <QuotaCard
          title="Uploads today"
          used={uploadUsed}
          limit={uploadLimit}
          description={`${remainingUploads} uploads remaining`}
        />
        <QuotaCard
          title="Downloads today"
          used={downloadUsed}
          limit={downloadLimit}
          description={`${Math.max(downloadLimit - downloadUsed, 0)} downloads remaining`}
        />
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 xl:col-span-2">
          <CardContent className="p-5">
            <p className="text-sm font-medium">Storage backend</p>
            <p className="text-sm text-muted-foreground mt-1">
              Files and records are stored in Supabase for demo. Upload/download APIs use a storage adapter so S3 can replace Supabase Storage later.
            </p>
            {dashboardError && <p className="text-sm text-destructive mt-2">{dashboardError}</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg">Metadata applied to uploads</CardTitle>
          <CardDescription>
            The medical record date is stored separately from the system upload timestamp.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <Field label="Medical Record Date">
            <Input
              type="date"
              value={metadata.recordDate}
              onChange={(event) => setMetadata((current) => ({ ...current, recordDate: event.target.value }))}
              className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800"
            />
          </Field>
          <Field label="IP Number">
            <Input
              value={metadata.ipNumber}
              onChange={(event) => setMetadata((current) => ({ ...current, ipNumber: event.target.value }))}
              placeholder="IP-2026-0001"
              className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800"
            />
          </Field>
          <Field label="Patient Name">
            <Input
              value={metadata.patientName}
              onChange={(event) => setMetadata((current) => ({ ...current, patientName: event.target.value }))}
              placeholder="Patient name"
              className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800"
            />
          </Field>
          <Field label="Doctor">
            <Input
              value={metadata.doctorName}
              onChange={(event) => setMetadata((current) => ({ ...current, doctorName: event.target.value }))}
              placeholder="Dr. name"
              className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800"
            />
          </Field>
          <Field label="Sections">
            <Input
              value={metadata.sections}
              onChange={(event) => setMetadata((current) => ({ ...current, sections: event.target.value }))}
              placeholder="Cardiology, ICU"
              className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Manual Upload</CardTitle>
            <CardDescription>Upload an individual scanned PDF securely</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6 pb-6">
            <div
              className={`flex-1 min-h-[280px] md:min-h-[360px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 md:p-12 text-center transition-colors cursor-pointer
                ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => setManualFile(event.target.files?.[0] ?? null)}
              />
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 md:p-4 rounded-full mb-4 md:mb-6">
                <CloudUpload className="h-10 w-10 md:h-12 md:w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">Drag and drop scanned PDFs here</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-4 md:mb-6 text-sm">or click to browse files</p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse PDFs
                </Button>
                <Button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleManualUpload();
                  }}
                  disabled={!manualFile || isUploading || remainingUploads <= 0}
                >
                  Upload file
                </Button>
              </div>

              <div className="mt-4 min-h-5 text-sm text-zinc-500 dark:text-zinc-400">
                {manualFile
                  ? `Selected: ${manualFile.name} (${formatBytes(manualFile.size)})`
                  : "No file selected"}
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-auto pt-8">
                <AlertCircle className="h-4 w-4" />
                <span>Supports PDF up to 50MB per file</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 flex flex-col">
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-lg">Folder day sync</CardTitle>
                  <CardDescription>
                    Pick a folder, choose a date, and upload matching PDFs for that day.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100 dark:border-emerald-900/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Browser sync ready
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Auto-sync simulation</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Browser security requires selecting the folder for each sync run.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {autoSync ? "Pause" : "Resume"}
                  </span>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} className="data-[state=checked]:bg-blue-600" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Sync day">
                  <div className="relative">
                    <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={syncDate}
                      onChange={(event) => setSyncDate(event.target.value)}
                      className="pl-9 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                </Field>
                <Field label="Folder">
                  <input
                    ref={folderInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    className="hidden"
                    {...directoryInputAttributes}
                    onChange={(event) => setFolderFiles(Array.from(event.target.files ?? []))}
                  />
                  <Button variant="outline" className="w-full justify-start" onClick={() => folderInputRef.current?.click()}>
                    <FolderOpen className="h-4 w-4" />
                    Choose folder
                  </Button>
                </Field>
              </div>

              <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{filesForSyncDate.length} PDFs match {syncDate}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {folderFiles.length} files scanned in selected folder. Matching files use this selected day as the medical record date.
                    </p>
                  </div>
                  <Button
                    onClick={handleFolderSync}
                    disabled={!autoSync || isUploading || filesForSyncDate.length === 0 || remainingUploads <= 0}
                  >
                    Sync matching files
                  </Button>
                </div>
              </div>

              {message && <p className="text-sm text-amber-600 dark:text-amber-400">{message}</p>}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Upload queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {queue.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-sm text-muted-foreground">
                  Upload activity will appear here.
                </div>
              ) : (
                <div className="space-y-4">
                  {queue.map((item) => (
                    <QueueRow
                      key={item.id}
                      item={item}
                      onDismiss={() => setQueue((current) => current.filter((queueItem) => queueItem.id !== item.id))}
                    />
                  ))}
                </div>
              )}

              <Separator className="bg-zinc-100 dark:bg-zinc-800" />

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Recently completed</p>
                {queue.filter((item) => item.status === "synced").slice(0, 3).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No completed uploads in this session.</p>
                ) : (
                  queue
                    .filter((item) => item.status === "synced")
                    .slice(0, 3)
                    .map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 -mx-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="text-sm text-zinc-600 dark:text-zinc-300 truncate">{item.name}</span>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-50 text-[10px] uppercase font-semibold tracking-wider">
                          Synced
                        </Badge>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      {children}
    </div>
  );
}

function QuotaCard({
  title,
  used,
  limit,
  description,
}: {
  title: string;
  used: number;
  limit: number;
  description: string;
}) {
  const value = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          <Badge variant="outline" className="font-mono text-xs">
            {used}/{limit}
          </Badge>
        </div>
        <Progress value={value} className="h-2" />
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function QueueRow({ item, onDismiss }: { item: QueueItem; onDismiss: () => void }) {
  const progress = item.status === "synced" || item.status === "failed" ? 100 : item.status === "uploading" ? 55 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm gap-4">
        <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{item.name}</span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-zinc-500 text-xs">
            {item.status === "failed" ? item.message : `${queueStatusLabel(item.status)} - ${formatBytes(item.size)}`}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-zinc-400 hover:text-red-600" onClick={onDismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <Progress
        value={progress}
        className={`h-1.5 bg-zinc-100 dark:bg-zinc-800 ${
          item.status === "failed" ? "[&>div]:bg-red-600" : "[&>div]:bg-blue-600"
        }`}
      />
    </div>
  );
}

function queueStatusLabel(status: QueueStatus) {
  if (status === "waiting") {
    return "Waiting";
  }

  if (status === "uploading") {
    return "Uploading";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Synced";
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
