"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BriefcaseBusiness, FolderKanban, Home, ImageIcon, KeyRound, LockKeyhole, Mail, Menu, PanelLeftClose, PanelLeftOpen, Settings, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
  { href: "/admin/hero", label: "Hero", icon: Sparkles },
  { href: "/admin/experience", label: "Experience", icon: BriefcaseBusiness },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/skills", label: "Skills", icon: KeyRound },
  { href: "/admin/highlights", label: "Highlights", icon: Sparkles },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/security", label: "Security", icon: ShieldCheck },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

type AdminNavProps = {
  email: string;
  role: string;
};

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function NavLinks({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex h-10 items-center gap-3 rounded-md px-3 text-sm text-white/58 transition hover:bg-white/[0.07] hover:text-white",
              collapsed && "justify-center px-0",
              isActive && "border border-white/10 bg-white/[0.09] text-white shadow-[0_0_24px_rgba(255,255,255,0.04)]",
            )}
          >
            <Icon className={cn("h-4 w-4 text-white/38 transition group-hover:text-white/70", isActive && "text-white/80")} />
            <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({ email, role }: AdminNavProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 bg-[#050507]/85 p-5 backdrop-blur-xl transition-all lg:block ${collapsed ? "w-20" : "w-72"}`}>
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
      <Link href="/admin" className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.05]">
          <LockKeyhole className="h-4 w-4 text-white/70" />
        </span>
        <span className={collapsed ? "sr-only" : ""}>
          <span className="block text-sm font-medium text-white">Ali Koroglu</span>
          <span className="block text-xs text-white/38">Admin Console</span>
        </span>
      </Link>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setCollapsed((value) => !value)}
        className={`border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white ${collapsed ? "absolute -right-4 top-6 h-8 w-8" : "h-8 w-8"}`}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </Button>
      </div>

      <div className="mt-8">
        <NavLinks collapsed={collapsed} />
      </div>

      <div className="absolute inset-x-5 bottom-5">
        <div className={`mb-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 ${collapsed ? "hidden" : ""}`}>
          <p className="truncate text-sm text-white/80">{email}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/35">{role}</p>
        </div>
        <LogoutButton iconOnly={collapsed} className={collapsed ? "px-0 sm:w-full" : "sm:w-full"} />
      </div>
    </aside>
  );
}

export function AdminHeader({ email, role }: AdminNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050507]/75 backdrop-blur-xl lg:ml-72">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-sm font-medium text-white">Admin Panel</p>
              <p className="hidden text-xs text-white/38 sm:block">Portfolio management and security center</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-sm text-white/78">{email}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-white/35">{role}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/70" onClick={() => setIsOpen(false)} aria-label="Close menu" />
          <aside className="relative h-full w-[min(320px,86vw)] border-r border-white/10 bg-[#050507] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Link href="/admin" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.05]">
                  <LockKeyhole className="h-4 w-4 text-white/70" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">Ali Koroglu</span>
                  <span className="block text-xs text-white/38">Admin Console</span>
                </span>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-8">
              <NavLinks onNavigate={() => setIsOpen(false)} />
            </div>

            <div className="absolute inset-x-5 bottom-5">
              <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <p className="truncate text-sm text-white/80">{email}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/35">{role}</p>
              </div>
              <LogoutButton className="sm:w-full" />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
