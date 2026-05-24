import { Search, Bell } from "lucide-react";
import { MedVaultLogo } from "./medvault-logo";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-8 w-1/3">
        <MedVaultLogo imageClassName="h-[50px] w-auto" />
      </div>

      <div className="flex-1 max-w-lg hidden md:block">
      </div>

      <div className="flex items-center justify-end gap-2 w-1/3">
        <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <Avatar className="h-9 w-9 border border-border">
          <AvatarImage src="https://i.pravatar.cc/150?u=dr_sharma" />
          <AvatarFallback className="bg-primary/10 text-primary">PS</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
