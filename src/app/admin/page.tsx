import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdminMonitoringData } from "@/lib/admin-service";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const userId = typeof data.claims.sub === "string" ? data.claims.sub : "";
  if (!userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: "toko" | "admin" | "anggota" }>();

  if (profileError || !profile) redirect("/login");
  if (profile.role !== "admin") redirect(profile.role === "anggota" ? "/katalog" : "/dashboard");

  let monitoringData: Awaited<ReturnType<typeof getAdminMonitoringData>> | null = null;
  let monitoringError = "";
  try {
    monitoringData = await getAdminMonitoringData();
  } catch (error) {
    monitoringError = error instanceof Error ? error.message : "Migration database admin belum dijalankan.";
  }

  if (monitoringData) {
    return <AdminDashboardClient initialData={monitoringData} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-6 text-center">
      <section className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8">
        <h1 className="text-xl font-extrabold text-amber-950">Admin Dashboard belum siap</h1>
        <p className="mt-3 text-sm leading-6 text-amber-900">{monitoringError}</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-[#0F2C23] px-4 py-2.5 text-sm font-bold text-white">
          Kembali ke Katalog
        </Link>
      </section>
    </main>
  );
}
