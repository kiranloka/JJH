"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Upload, 
  HardDrive, 
  Activity, 
  Settings,
  Menu
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Records", href: "/records", icon: FolderOpen },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={`border-r border-purple-900/30 bg-[#6B2580] transition-all duration-300 hidden md:flex flex-col ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="p-4 flex items-center justify-end">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? "bg-white/20 text-white font-semibold shadow-sm"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-white/15 flex flex-col gap-4">
        <Link 
          href="/login"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-white/70 hover:bg-red-500/20 hover:text-red-200 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? "Logout" : undefined}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </Link>
        {!collapsed && <span className="text-xs text-white/40">JJ Hospital v2.4.1</span>}
      </div>
    </aside>
  );
}
