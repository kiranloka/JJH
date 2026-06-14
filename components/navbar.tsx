"use client";

import { Bell, Menu } from "lucide-react";
import { MedVaultLogo } from "./medvault-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/sidebar-provider";

export function Navbar() {
  const { toggle } = useSidebar();

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 md:gap-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="text-muted-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <MedVaultLogo imageClassName="h-[40px] md:h-[50px] w-auto" />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="w-px h-6 bg-border mx-1 md:mx-2" />
        <Avatar className="h-8 w-8 md:h-9 md:w-9 border border-border">
          <AvatarImage src="https://i.pravatar.cc/150?u=dr_sharma" />
          <AvatarFallback className="bg-primary/10 text-primary">PS</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
