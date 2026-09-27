"use client";

import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export function NotificationPopover() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg border-slate-200">
        <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" /> Mark read
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No new notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 transition-colors text-xs ${
                  n.isRead ? "bg-white text-slate-600" : "bg-emerald-50/40 text-slate-800 font-medium"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-900">{n.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                {n.link && (
                  <Link
                    href={n.link}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
                  >
                    View details <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
