"use client";

import { Globe, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MedVaultLogo } from "@/components/medvault-logo";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <div className="flex justify-center mb-4 sm:mb-8">
          <MedVaultLogo imageClassName="h-[50px] sm:h-[80px] w-auto" />
        </div>

        <Card className="border-border shadow-sm rounded-2xl bg-card">
          <CardHeader className="space-y-2 text-center pb-4 sm:pb-6 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight">Sign in to your workspace</CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">
              Securely access and manage patient records
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Input
                  type="email"
                  placeholder="hospital.email@example.com"
                  className="rounded-xl h-11 bg-background"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl h-11 bg-background"
                  required
                />
                <div className="flex justify-end">
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl font-medium">
                Sign in
              </Button>
            </form>

            <div className="relative my-5 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full h-11 rounded-xl font-medium" onClick={handleSignIn}>
              <Globe className="mr-2 h-4 w-4" />
              Google SSO
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-5 sm:pt-6 pb-5 sm:pb-6 px-4 sm:px-6">
            <div className="flex items-center text-xs text-zinc-400 gap-1.5 text-center">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Access restricted to authorised hospital staff only</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
