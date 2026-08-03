import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Role = "toko" | "admin";
type AdminAction = "role" | "ban" | "reset_password";

interface ProfileRow {
  id: string;
  role: Role;
  full_name: string | null;
}

interface StoreRow {
  owner_id: string;
  name: string;
  is_active: boolean;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";
  if (!userId) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle<{ role: Role }>();
  if (error || profile?.role !== "admin") return null;

  return { userId };
}

async function listAllUsers(serviceClient: NonNullable<ReturnType<typeof getServiceClient>>) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

async function recordUserAudit(
  serviceClient: NonNullable<ReturnType<typeof getServiceClient>>,
  adminId: string,
  action: "create" | "role" | "ban" | "unban" | "reset_password",
  userId: string,
  details: Record<string, unknown> = {},
) {
  const { error } = await serviceClient.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    resource: "user",
    resource_id: userId,
    details,
  });
  if (error) console.error("Failed to record admin user audit", error);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Akses admin diperlukan.", 403);

  const serviceClient = getServiceClient();
  if (!serviceClient) return jsonError("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.", 503);

  try {
    const [users, profilesResult, storesResult] = await Promise.all([
      listAllUsers(serviceClient),
      serviceClient.from("profiles").select("id, role, full_name").returns<ProfileRow[]>(),
      serviceClient.from("stores").select("owner_id, name, is_active").returns<StoreRow[]>(),
    ]);
    if (profilesResult.error || storesResult.error) throw profilesResult.error ?? storesResult.error;

    const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
    const stores = new Map((storesResult.data ?? []).map((store) => [store.owner_id, store]));
    const result = users
      .map((user) => {
        const profile = profiles.get(user.id);
        const store = stores.get(user.id);
        return {
          id: user.id,
          email: user.email ?? "",
          full_name: profile?.full_name ?? (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""),
          role: profile?.role ?? "toko",
          store_name: store?.name ?? null,
          store_is_active: store?.is_active ?? null,
          email_confirmed: Boolean(user.email_confirmed_at),
          banned_until: user.banned_until ?? null,
          is_current_user: user.id === admin.userId,
          created_at: user.created_at,
        };
      })
      .sort((a, b) => a.email.localeCompare(b.email));

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("Failed to load admin users", error);
    return jsonError("Daftar user gagal dimuat.", 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Akses admin diperlukan.", 403);

  const serviceClient = getServiceClient();
  if (!serviceClient) return jsonError("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.", 503);

  let body: { email?: string; password?: string; full_name?: string; role?: Role };
  try {
    body = await request.json();
  } catch {
    return jsonError("Format request tidak valid.", 400);
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const fullName = body.full_name?.trim() ?? "";
  const role = body.role ?? "toko";
  if (!email || !email.includes("@")) return jsonError("Email user tidak valid.", 400);
  if (password.length < 6) return jsonError("Password minimal 6 karakter.", 400);
  if (role !== "toko" && role !== "admin") return jsonError("Role tidak valid.", 400);

  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) return jsonError(error?.message ?? "User gagal dibuat.", 400);

  const { error: profileError } = await serviceClient
    .from("profiles")
    .upsert({ id: data.user.id, role, full_name: fullName || null }, { onConflict: "id" });
  if (profileError) {
    await serviceClient.auth.admin.deleteUser(data.user.id);
    return jsonError("User dibuat tetapi profile gagal disimpan.", 500);
  }

  await recordUserAudit(serviceClient, admin.userId, "create", data.user.id, { email, role });

  return NextResponse.json({ ok: true, user_id: data.user.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Akses admin diperlukan.", 403);

  const serviceClient = getServiceClient();
  if (!serviceClient) return jsonError("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.", 503);

  let body: { user_id?: string; action?: AdminAction; role?: Role; banned?: boolean; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Format request tidak valid.", 400);
  }

  const userId = body.user_id?.trim();
  const action = body.action;
  if (!userId || !action) return jsonError("User dan aksi wajib diisi.", 400);
  if (userId === admin.userId && ((action === "ban" && body.banned) || (action === "role" && body.role !== "admin"))) {
    return jsonError("Akun admin yang sedang digunakan tidak dapat dinonaktifkan atau diturunkan rolenya.", 400);
  }

  if (action === "role") {
    if (body.role !== "toko" && body.role !== "admin") return jsonError("Role tidak valid.", 400);
    const { error } = await serviceClient.from("profiles").upsert({ id: userId, role: body.role }, { onConflict: "id" });
    if (error) return jsonError("Role user gagal diperbarui.", 500);
    await recordUserAudit(serviceClient, admin.userId, "role", userId, { role: body.role });
    return NextResponse.json({ ok: true });
  }

  if (action === "ban") {
    const { error } = await serviceClient.auth.admin.updateUserById(userId, {
      ban_duration: body.banned ? "876000h" : "none",
    });
    if (error) return jsonError("Status user gagal diperbarui.", 400);
    await recordUserAudit(serviceClient, admin.userId, body.banned ? "ban" : "unban", userId);
    return NextResponse.json({ ok: true });
  }

  if (action === "reset_password") {
    if (!body.password || body.password.length < 6) return jsonError("Password baru minimal 6 karakter.", 400);
    const { error } = await serviceClient.auth.admin.updateUserById(userId, { password: body.password });
    if (error) return jsonError("Password user gagal direset.", 400);
    await recordUserAudit(serviceClient, admin.userId, "reset_password", userId);
    return NextResponse.json({ ok: true });
  }

  return jsonError("Aksi tidak didukung.", 400);
}
