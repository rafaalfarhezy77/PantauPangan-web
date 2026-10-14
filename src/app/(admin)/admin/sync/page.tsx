"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  Database,
  Layers,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SyncMetadata {
  id: number;
  level: string;
  regionScope: string;
  commodityCount: number;
  rowCount: number;
  periodFrom: string | null;
  periodTo: string | null;
  lastCheckedAt: string | null;
  lastSyncedAt: string | null;
  lastSyncStatus: string | null;
  creditsEstimated: number;
}

interface AuditLog {
  id: number;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadataJson: string | null;
  createdAt: string;
}

export default function AdminSyncPage() {
  const [metadata, setMetadata] = useState<SyncMetadata[]>([]);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchSyncData = async () => {
    try {
      const res = await fetch("/api/v1/admin/sync");
      const json = await res.json();
      if (json.success) {
        setMetadata(json.metadata || []);
        setHistory(json.history || []);
      } else {
        toast.error(json.error || "Gagal memuat status sinkronisasi.");
      }
    } catch {
      toast.error("Terjadi masalah jaringan.");
    }
  };

  useEffect(() => {
    fetchSyncData();
  }, []);

  const handleRunSync = async (forceFullSync = false) => {
    setIsSyncing(true);
    const toastId = toast.loading(
      forceFullSync
        ? "Menjalankan Full Sync ke API Indonesia..."
        : "Memeriksa perubahan dan menjalankan Smart Delta Sync..."
    );

    try {
      const res = await fetch("/api/v1/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceFullSync }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(
          json.message || "Smart Delta Sync berhasil dieksekusi!",
          { id: toastId }
        );
        fetchSyncData();
      } else {
        toast.error(json.error || "Gagal menjalankan sinkronisasi.", {
          id: toastId,
        });
      }
    } catch {
      toast.error("Terjadi kegagalan jaringan saat menghubungi API Indonesia.", {
        id: toastId,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper untuk mencari kartu dari 4 kombinasi utama
  const getMatrixItem = (level: string, regionScope: string) => {
    return (
      metadata.find(
        (m) => m.level === level && m.regionScope === regionScope
      ) || null
    );
  };

  const matrixConfigs = [
    {
      level: "konsumen",
      regionScope: "nasional",
      title: "Konsumen • Nasional",
      desc: "Harga eceran rata-rata agregat seluruh Indonesia",
      color: "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20",
    },
    {
      level: "konsumen",
      regionScope: "provinsi",
      title: "Konsumen • 38 Provinsi",
      desc: "Harga eceran pasar harian terdisagregasi per provinsi",
      color: "border-blue-500/40 bg-blue-50/20 dark:bg-blue-950/20",
    },
    {
      level: "produsen",
      regionScope: "nasional",
      title: "Produsen • Nasional",
      desc: "Harga tingkat petani agregat nasional",
      color: "border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/20",
    },
    {
      level: "produsen",
      regionScope: "provinsi",
      title: "Produsen • 38 Provinsi",
      desc: "Harga tingkat sentra tani per provinsi",
      color: "border-teal-500/40 bg-teal-50/20 dark:bg-teal-950/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              API Indonesia Sync Control Center
            </h1>
            <Badge className="bg-purple-600 text-white text-xs px-2 py-0.5">
              Live Gateway
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Pengganti upload CSV manual: Sinkronisasi data harga dan anomali secara otomatis langsung dari server API Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRunSync(false)}
            disabled={isSyncing}
            className="text-xs gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            Cek Pembaruan & Delta Sync
          </Button>

          <Button
            size="sm"
            onClick={() => handleRunSync(true)}
            disabled={isSyncing}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            Jalankan Full Sync
          </Button>
        </div>
      </div>

      {/* 4 Matrix Summary Cards */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          Status Matriks Sinkronisasi 4 Seri Data
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {matrixConfigs.map((cfg) => {
            const data = getMatrixItem(cfg.level, cfg.regionScope);
            return (
              <div
                key={`${cfg.level}-${cfg.regionScope}`}
                className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between ${cfg.color}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{cfg.title}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {data?.lastSyncStatus || "idle"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    {cfg.desc}
                  </p>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Komoditas:</span>
                      <span className="font-bold text-foreground">
                        {data?.commodityCount ?? 0} Jenis
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Baris Data:</span>
                      <span className="font-bold text-foreground">
                        {(data?.rowCount ?? 0).toLocaleString("id-ID")} rows
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rentang Bulan:</span>
                      <span className="font-mono text-[11px] text-foreground font-semibold">
                        {data?.periodFrom || "N/A"} s/d {data?.periodTo || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground/80 shrink-0" />
                  <span>
                    Sync:{" "}
                    {data?.lastSyncedAt
                      ? new Date(data.lastSyncedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Belum pernah"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel Riwayat Eksekusi Sinkronisasi & Kredit API */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base font-bold">
                Riwayat Eksekusi Smart Delta Sync & Estimasi Kredit
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Log audit pemanggilan API Indonesia resmi tanpa upload berkas CSV manual
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {history.length} Log Eksekusi Tercatat
          </Badge>
        </CardHeader>

        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Belum ada riwayat eksekusi sinkronisasi tercatat di audit log.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Waktu Eksekusi</th>
                    <th className="py-2.5 px-3">Aksi</th>
                    <th className="py-2.5 px-3">Target Seri</th>
                    <th className="py-2.5 px-3">Durasi</th>
                    <th className="py-2.5 px-3">Detail Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {history.map((log) => {
                    let parsed: Record<string, unknown> = {};
                    try {
                      if (log.metadataJson) parsed = JSON.parse(log.metadataJson);
                    } catch {}

                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-mono">
                          {new Date(log.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-foreground font-mono">
                          {log.targetId || "all_series"}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {parsed.durationMs ? `${parsed.durationMs} ms` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px] max-w-xs truncate">
                          {log.metadataJson || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
