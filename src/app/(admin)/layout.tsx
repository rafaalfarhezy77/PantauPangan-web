import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminNav } from "@/components/layout/AdminNav";

export const metadata = {
  title: "Admin Center | PantauPangan v2.0",
  description: "Pusat manajemen master komoditas, pengguna, CMS berita, dan Smart Sync API Indonesia.",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSession();

  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
      <AdminNav user={user} />
      <main className="flex-1 max-w-7xl w-full p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
