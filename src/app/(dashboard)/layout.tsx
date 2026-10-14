import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardNav } from "@/components/layout/DashboardNav";

export const metadata = {
  title: "Workspace Dashboard | PantauPangan v2.0",
  description: "Pusat kendali personalisasi harga pangan nasional berbasis peran pengguna.",
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950/50">
      <DashboardNav user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground bg-background">
        <p>© 2026 PantauPangan v2.0 — Sistem Informasi Harga Komoditas Pangan Nasional</p>
      </footer>
    </div>
  );
}
