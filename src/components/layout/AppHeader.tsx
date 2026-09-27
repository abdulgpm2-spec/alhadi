"use client";

import React from "react";
import Link from "next/link";
import { Search, Menu, Building, Plus, User as UserIcon, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationPopover } from "@/components/common/NotificationPopover";
import { SessionUser } from "@/types";

interface AppHeaderProps {
  user: SessionUser;
  onOpenMobileNav: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
}

export function AppHeader({ user, onOpenMobileNav, onOpenSearch, onLogout }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-6 backdrop-blur shadow-xs">
      {/* Left side: Mobile hamburger & Search trigger */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-600"
          onClick={onOpenMobileNav}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Global Search Bar Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex h-9 w-64 md:w-80 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-100/70 transition-colors shadow-xs"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search records, IDs...</span>
          </span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 shadow-xs">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right side: Quick Action, Branch info, Notifications & User */}
      <div className="flex items-center gap-2.5">
        {/* Quick New Work Action */}
        <Link href="/work/new">
          <Button size="sm" className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs text-xs font-semibold h-8">
            <Plus className="h-3.5 w-3.5" />
            <span>New Work</span>
          </Button>
        </Link>

        {/* Branch Info Tag */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs border border-slate-200">
          <Building className="h-3.5 w-3.5 text-slate-500" />
          <span className="font-medium truncate max-w-[140px]">
            {user.branchName || "Main Branch"}
          </span>
        </div>

        {/* Notifications */}
        <NotificationPopover />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 p-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-white text-xs font-bold shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white border-slate-200 shadow-lg">
            <DropdownMenuLabel className="font-normal p-3 pb-2">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                <span className="inline-block w-fit text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 mt-1">
                  {user.role}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer text-xs">
                <UserIcon className="h-3.5 w-3.5 text-slate-500" /> Profile & Password
              </Link>
            </DropdownMenuItem>
            {user.role === "ADMIN" && (
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer text-xs">
                  <SettingsIcon className="h-3.5 w-3.5 text-slate-500" /> Business Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="flex items-center gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer text-xs"
            >
              <LogOut className="h-3.5 w-3.5" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
