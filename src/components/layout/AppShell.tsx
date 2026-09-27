"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { CommandSearchDialog } from "@/components/common/CommandSearchDialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SessionUser } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
  user: SessionUser;
}

export function AppShell({ children, user }: AppShellProps) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
      window.location.href = "/login";
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <AppSidebar user={user} onLogout={handleLogout} />
      </div>

      {/* Mobile Drawer Sidebar */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-slate-900 border-r-0">
          <AppSidebar
            user={user}
            onLogout={handleLogout}
            onLinkClick={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          user={user}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Palette Dialog */}
      <CommandSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
