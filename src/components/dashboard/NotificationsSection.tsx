"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "anomaly_alert" | "price_threshold" | "sync_update";
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsSection() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/notifications");
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
        setUnreadCount(json.unreadCount);
      }
    } catch {
      toast.error("Gagal memuat notifikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id?: string) => {
    try {
      const res = await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { markAll: true }),
      });
      const json = await res.json();
      if (json.success) {
        if (id) {
          setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
          toast.success("Notifikasi ditandai dibaca.");
        } else {
          setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
          setUnreadCount(0);
          toast.success("Seluruh notifikasi telah ditandai dibaca.");
        }
      }
    } catch {
      toast.error("Gagal memperbarui notifikasi.");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "anomaly_alert":
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case "price_threshold":
        return <TrendingUp className="w-4 h-4 text-amber-600" />;
      case "sync_update":
        return <RefreshCw className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const displayedItems = filterUnreadOnly
    ? items.filter((n) => !n.isRead)
    : items;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-lg font-bold">Pusat Notifikasi Pangan</CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-rose-600 text-white hover:bg-rose-600 text-[11px] px-2 py-0">
                {unreadCount} Baru
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs mt-1">
            Peringatan lonjakan/anjlok harga ekstrem dan anomali rantai pasok
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className="text-xs"
          >
            {filterUnreadOnly ? "Semua Notifikasi" : "Hanya Belum Dibaca"}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkAsRead()}
              className="text-xs gap-1 border-border"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tandai Semua Dibaca
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Memuat notifikasi...
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-border rounded-xl bg-muted/20">
            <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <h4 className="font-semibold text-foreground text-sm">Tidak Ada Notifikasi</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Saat ini belum ada peringatan harga anomali pada wilayah pantauan Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedItems.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  n.isRead
                    ? "bg-muted/30 border-border/60 text-muted-foreground"
                    : "bg-card border-emerald-500/30 shadow-xs text-foreground font-medium"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted/60 mt-0.5 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground">{n.title}</h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 block mt-1">
                      {new Date(n.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {n.linkUrl && (
                    <Link href={n.linkUrl}>
                      <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:text-emerald-700 h-8 gap-1">
                        Lihat Data
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  )}
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkAsRead(n.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                      title="Tandai telah dibaca"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
