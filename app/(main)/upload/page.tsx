"use client";

import { CloudUpload, Copy, CheckCircle2, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function UploadPage() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Upload Records</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manually upload files or monitor the scanner auto-sync agent</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left Panel: Drag and Drop */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Manual Upload</CardTitle>
            <CardDescription>Upload individual patient records securely</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Patient Name (Optional)</label>
                <Input placeholder="e.g. John Doe" className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Doctor (Optional)</label>
                <Input placeholder="e.g. Dr. Sarah Smith" className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800" />
              </div>
            </div>
            <div 
              className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center transition-colors cursor-pointer
                ${isDragActive 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              onMouseEnter={() => setIsDragActive(true)}
              onMouseLeave={() => setIsDragActive(false)}
            >
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-6">
                <CloudUpload className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Drag & drop scanned PDFs here</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">or click to browse files</p>
              
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-auto pt-8">
                <AlertCircle className="h-4 w-4" />
                <span>Supports PDF up to 50MB per file</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Auto-sync and Queue */}
        <div className="space-y-6 flex flex-col">
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Auto-sync status</CardTitle>
                  <CardDescription>Monitor the MedVault desktop scanner agent</CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100 dark:border-emerald-900/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Scanner agent active
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Last sync</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Today at 10:23 AM</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {autoSync ? "Pause sync" : "Resume sync"}
                  </span>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} className="data-[state=checked]:bg-blue-600" />
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div className="truncate">
                  <p className="text-xs text-zinc-500 mb-1">Watched folder</p>
                  <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300">C:\Scanner\Output</code>
                </div>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-900">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Upload queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Active Uploads */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  <span>Uploading (2)</span>
                  <span className="text-zinc-500 font-normal">3.2 MB/s</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">IP-2024-0893_Lab_Results.pdf</span>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 text-xs">45% • 1.8 MB</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-zinc-400 hover:text-red-600">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={45} className="h-1.5 [&>div]:bg-blue-600 bg-zinc-100 dark:bg-zinc-800" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">IP-2024-0905_Discharge.pdf</span>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 text-xs">Waiting</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-zinc-400 hover:text-red-600">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={0} className="h-1.5 bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                </div>
              </div>

              <Separator className="bg-zinc-100 dark:bg-zinc-800" />

              {/* Completed */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  <span>Recently completed</span>
                </div>
                
                <div className="space-y-3">
                  {[
                    { name: "IP-2024-0892_History.pdf", size: "2.4 MB" },
                    { name: "IP-2024-0894_Summary.pdf", size: "4.1 MB" },
                  ].map((file, i) => (
                    <div key={i} className="flex justify-between items-center p-2 -mx-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-zinc-600 dark:text-zinc-300 truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500">{file.size}</span>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-50 text-[10px] uppercase font-semibold tracking-wider">
                          Synced
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
