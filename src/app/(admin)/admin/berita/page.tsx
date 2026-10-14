import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { commodities } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { ArticlesManagementClient } from "@/components/admin/ArticlesManagementClient";

export const metadata = {
  title: "CMS Berita Pangan | Admin Center PantauPangan",
};

export default async function AdminBeritaPage() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  const commodityList = await db
    .select({ id: commodities.id, name: commodities.displayName })
    .from(commodities)
    .orderBy(asc(commodities.displayName));

  return <ArticlesManagementClient commodities={commodityList} />;
}
