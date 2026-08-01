"use client";

import { useRouter } from "next/navigation";
import { StoreDashboard } from "@/components/StoreDashboard";
import { createClient } from "@/lib/supabase/client";

export function DashboardClient() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    router.replace("/login");
    router.refresh();
  };

  return <StoreDashboard onBackToCatalog={() => router.push("/")} onSignOut={handleSignOut} />;
}
