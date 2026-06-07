"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLogout}
      className={cn("w-full border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white sm:w-auto", className)}
    >
      <LogOut className={cn("h-4 w-4", !iconOnly && "mr-2")} />
      <span className={iconOnly ? "sr-only" : ""}>Logout</span>
    </Button>
  );
}
