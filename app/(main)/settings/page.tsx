"use client";

import { 
  Building2, 
  HardDrive, 
  Download, 
  Bell, 
  ShieldAlert,
  Smartphone,
  Laptop
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { StorageBar } from "@/components/storage-bar";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage hospital preferences, security, and storage</p>
      </div>

      <div className="space-y-8">
        
        {/* 1. Hospital Profile */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Building2 className="h-5 w-5 text-zinc-500" />
            Hospital Profile
          </h2>
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-6 items-start">
                <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 gap-2 shrink-0">
                  <div className="bg-white dark:bg-zinc-700 p-2 rounded-lg shadow-sm">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hospital Name</label>
                      <Input defaultValue="JJ Hospital" className="bg-zinc-50 dark:bg-zinc-950" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Location</label>
                      <Input defaultValue="Hyderabad, India" className="bg-zinc-50 dark:bg-zinc-950" />
                    </div>
                  </div>
                  <Button variant="outline" className="h-9 font-medium">Upload new logo</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 2. Storage */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <HardDrive className="h-5 w-5 text-zinc-500" />
            Storage & Plan
          </h2>
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="col-span-2 p-6 flex flex-col justify-center border-r border-zinc-100 dark:border-zinc-800">
                <StorageBar />
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-950/50 flex flex-col justify-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Current Plan</p>
                <p className="text-xl font-bold mb-4">Enterprise 5TB</p>
                <Button variant="outline" className="w-full font-medium">Upgrade Plan</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. Scanner Agent */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Download className="h-5 w-5 text-zinc-500" />
            Desktop Scanner Agent
          </h2>
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">Background Auto-sync</p>
                  <p className="text-sm text-zinc-500">Automatically upload PDFs placed in the watched folder</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
              </div>
              
              <Separator className="bg-zinc-100 dark:border-zinc-800" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500 mb-1">Watched Folder Path</p>
                  <code className="bg-zinc-100 dark:bg-zinc-950 px-2 py-1 rounded text-zinc-700 dark:text-zinc-300">C:\Scanner\Output</code>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Agent Version</p>
                  <p className="font-medium">v2.4.1 (Up to date)</p>
                </div>
              </div>

              <Button variant="outline" className="font-medium">
                <Download className="mr-2 h-4 w-4" />
                Download Agent for Windows
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* 4. Notifications */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Bell className="h-5 w-5 text-zinc-500" />
            Notifications
          </h2>
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">Upload complete</p>
                  <p className="text-sm text-zinc-500">Get notified when a large batch finishes syncing</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
              </div>
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">Storage warning</p>
                  <p className="text-sm text-zinc-500">Alert me when storage exceeds 80%</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
              </div>
              <div className="flex items-center justify-between p-6">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">Failed uploads</p>
                  <p className="text-sm text-zinc-500">Immediate alert if a file fails to process</p>
                </div>
                <Switch defaultChecked className="data-[state=checked]:bg-blue-600" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 5. Security */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <ShieldAlert className="h-5 w-5 text-zinc-500" />
            Security & Access
          </h2>
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <CardContent className="p-6 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">Change Password</p>
                  <p className="text-sm text-zinc-500">Update your account password</p>
                </div>
                <Button variant="outline">Update</Button>
              </div>

              <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-6">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">Session Timeout</p>
                  <p className="text-sm text-zinc-500">Automatically log out after inactivity</p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm">
                  15 minutes
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 space-y-4">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">Active Sessions</p>
                
                <div className="flex justify-between items-center p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">MacBook Pro (Current)</p>
                      <p className="text-xs text-zinc-500">Hyderabad, India • Active now</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg text-zinc-500">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">iPhone 14 Pro</p>
                      <p className="text-xs text-zinc-500">Hyderabad, India • Last active 2 hours ago</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950">
                    Revoke
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>
        </section>

        

      </div>
    </div>
  );
}
