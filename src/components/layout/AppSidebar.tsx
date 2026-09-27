"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  SlidersHorizontal,
  GitBranch,
  CreditCard,
  Receipt,
  TrendingDown,
  BarChart3,
  UserCheck,
  Building2,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionUser } from "@/types";

interface AppSidebarProps {
  user: SessionUser;
  onLogout: () => void;
  onLinkClick?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: string;
}

export function AppSidebar({ user, onLogout, onLinkClick }: AppSidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Services", href: "/services", icon: Layers, roles: ["ADMIN", "EMPLOYEE", "AGENT"] },
    {
      label: user.role === "AGENT" ? "My Work Orders" : "Work Management",
      href: "/work",
      icon: Briefcase,
    },
    { label: "Payments", href: "/payments", icon: CreditCard },
    { label: "Receipts", href: "/receipts", icon: Receipt },
    { label: "Expenses", href: "/expenses", icon: TrendingDown, roles: ["ADMIN"] },
    { label: "Reports & Analytics", href: "/reports", icon: BarChart3, roles: ["ADMIN"] },
    { label: "Office Team", href: "/employees", icon: UserCheck, roles: ["ADMIN"] },
    { label: "Partner Agents", href: "/agents", icon: Building2, roles: ["ADMIN"] },
    { label: "WhatsApp Alerts", href: "/whatsapp", icon: MessageSquare, roles: ["ADMIN", "EMPLOYEE"] },
    { label: "Business Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
    { label: "Permission Management", href: "/settings/permissions", icon: ShieldCheck, roles: ["ADMIN"] },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-slate-200 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800 bg-slate-950/40">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onLinkClick}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/30">
            AH
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              AL-HADI
              <span className="text-[10px] font-medium bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                ERP
              </span>
            </span>
            <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
              Aaple Sarkar Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Role Badge Container */}
      <div className="px-4 py-3 bg-slate-950/20 border-b border-slate-800/60">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-slate-800/60 text-xs">
          <span className="text-slate-400 text-[11px]">Logged in as:</span>
          <span className={cn(
            "font-semibold text-[11px] px-2 py-0.5 rounded-full",
            user.role === "ADMIN" && "bg-purple-900/60 text-purple-300 border border-purple-700/50",
            user.role === "EMPLOYEE" && "bg-blue-900/60 text-blue-300 border border-blue-700/50",
            user.role === "AGENT" && "bg-amber-900/60 text-amber-300 border border-amber-700/50"
          )}>
            {user.role}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "group flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-emerald-600 text-white font-semibold shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-emerald-200" />}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="border-t border-slate-800 p-3 bg-slate-950/30">
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-800/60 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-600">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
