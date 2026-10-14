import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { provinces } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { UserManagementClient } from "@/components/admin/UserManagementClient";

export const metadata = {
  title: "Manajemen Pengguna | Admin Center PantauPangan",
};

export default async function AdminUsersPage() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/dashboard");
  }

  const provinceList = await db
    .select({ code: provinces.code, name: provinces.name })
    .from(provinces)
    .orderBy(asc(provinces.name));

  return (
    <UserManagementClient
      currentAdminId={session.id}
      provinces={provinceList}
    />
  );
}
