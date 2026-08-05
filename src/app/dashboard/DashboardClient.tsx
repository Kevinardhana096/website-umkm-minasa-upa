"use client";

import { useRouter } from "next/navigation";
import { StoreDashboard } from "@/components/StoreDashboard";
import { createClient } from "@/lib/supabase/client";
import type { StoreData } from "@/lib/store-service";

export function DashboardClient({ initialData }: { initialData: StoreData }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    router.replace("/login");
  };

  return <StoreDashboard initialData={initialData} onBackToCatalog={() => router.push("/")} onSignOut={handleSignOut} />;
}
