import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
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
    .maybeSingle<{ role: "toko" | "admin" }>();

  if (profileError || !profile || (profile.role !== "toko" && profile.role !== "admin")) {
    redirect("/login");
  }
  if (profile.role === "admin") redirect("/admin");

  return <DashboardClient />;
}
