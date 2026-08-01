import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Dev Access hanya tersedia pada development." }, { status: 404 });
  }

  const email = process.env.DEV_ACCESS_EMAIL?.trim();
  const password = process.env.DEV_ACCESS_PASSWORD;
  if (!email || !password) {
    return NextResponse.json(
      { error: "DEV_ACCESS_EMAIL dan DEV_ACCESS_PASSWORD belum dikonfigurasi di .env.local." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: "Akun Dev Access gagal login. Periksa kredensial development." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
