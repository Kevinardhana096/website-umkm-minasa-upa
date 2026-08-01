import { createClient } from "@supabase/supabase-js";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Environment variable ${name} wajib diisi.`);
  }
  return value;
}

const supabaseUrl = process.env.SUPABASE_URL?.trim() || requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const adminEmail = requiredEnv("ADMIN_EMAIL").toLowerCase();
const adminPassword = requiredEnv("ADMIN_PASSWORD");
const fullName = process.env.ADMIN_FULL_NAME?.trim() || "Administrator UMKM";

if (adminPassword.length < 6) {
  throw new Error("ADMIN_PASSWORD minimal 6 karakter.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
}

async function main() {
  let user = await findUserByEmail(adminEmail);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    user = data.user;
    console.log(`User admin dibuat: ${user.id}`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: { ...user.user_metadata, full_name: fullName },
    });
    if (error) throw error;
    console.log(`User sudah ada dan dikonfirmasi: ${user.id}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, role: "admin", full_name: fullName }, { onConflict: "id" });
  if (profileError) throw profileError;

  console.log(`Role profile untuk ${adminEmail} sekarang: admin`);
  console.log("Selesai. Jangan menyimpan service-role key atau password ke repository.");
}

main().catch((error) => {
  console.error(`Gagal membuat admin: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
