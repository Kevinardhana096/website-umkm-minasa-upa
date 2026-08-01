import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedNextPaths = new Set(["/reset-password"]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") ?? "/reset-password";
  const next = allowedNextPaths.has(requestedNext) ? requestedNext : "/reset-password";

  if (!code) {
    return NextResponse.redirect(new URL("/reset-password?error=invalid-link", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/reset-password?error=invalid-link", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
