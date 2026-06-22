"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  HardDrive,
  Activity,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/sidebar-provider";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sections", href: "/sections", icon: Activity },
  { name: "Records", href: "/records", icon: FolderOpen },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { isOpen, close } = useSidebar();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`border-r border-purple-900/30 bg-[#6B2580] transition-all duration-300 flex flex-col
          fixed inset-y-0 left-0 z-50 w-60 md:static md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 flex items-center justify-between md:justify-end">
          <span className="text-white font-semibold text-sm md:hidden">
            JJ Hospital
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (isOpen ? close() : setCollapsed(!collapsed))}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-white/70 hover:bg-red-500/20 hover:text-red-200 w-full ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
          {!collapsed && <span className="text-xs text-white/40">JJ Hospital v2.4.1</span>}
        </div>
      </aside>
    </>
  );
}
