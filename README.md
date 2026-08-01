# Katalog UMKM

Website katalog produk UMKM berbasis Next.js dan Supabase.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Supabase setup

1. Buat project baru di [Supabase](https://supabase.com/dashboard).
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dari Project Settings → API.
4. Jalankan isi `supabase/schema.sql` di Supabase SQL Editor.
5. Aktifkan Email provider pada Authentication → Providers untuk login email/password.
6. Pada Authentication → Providers → Email, nonaktifkan **Allow new users to sign up** dan **Confirm Email**. Akun toko hanya dibuat oleh pengelola melalui proses internal dan dapat login tanpa verifikasi email.

Pada Authentication → URL Configuration, tambahkan `http://localhost:3000/auth/callback` ke Redirect URLs. Untuk production, tambahkan juga URL domain production dengan path yang sama. Alur lupa kata sandi memakai callback `/auth/callback` lalu mengarahkan pengguna ke `/reset-password`.

Client Supabase tersedia di `src/lib/supabase/client.ts` untuk Client Components dan `src/lib/supabase/server.ts` untuk Server Components, Server Actions, serta Route Handlers. `src/proxy.ts` menjaga sesi Auth berbasis cookie tetap diperbarui.

Jangan memasukkan secret/service-role key ke variabel `NEXT_PUBLIC_*` atau ke kode browser.

> Penting: halaman `/register` hanya menutup pendaftaran dari sisi aplikasi. Menonaktifkan public sign-up di pengaturan Supabase tetap wajib agar endpoint Auth tidak dapat digunakan untuk membuat akun publik.

## Membuat akun admin

Pembuatan user Auth dan perubahan role `profiles` membutuhkan service-role key, jadi jalankan script ini hanya dari terminal lokal atau server tepercaya. Jangan pernah menaruh key tersebut di Vercel sebagai variabel `NEXT_PUBLIC_*` atau commit ke Git.

Di PowerShell, dari folder project:

```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "service-role-key-dari-supabase"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "password-kuat-minimal-6-karakter"
$env:ADMIN_FULL_NAME = "Administrator UMKM"
npm run create:admin
```

Script bersifat idempotent: jika email sudah ada, password tidak diubah; user dikonfirmasi dan profile-nya diatur menjadi role `admin`. Password hanya dipakai saat membuat user baru.

Pada development lokal, kartu **Dev Access** di halaman login dapat memakai akun ini sebagai shortcut. Tambahkan `DEV_ACCESS_EMAIL` dan `DEV_ACCESS_PASSWORD` di `.env.local`, lalu restart `npm run dev`. Endpoint shortcut hanya aktif ketika `NODE_ENV=development` dan tidak tersedia pada deployment production.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy ke Vercel

Repository ini siap dideploy dari branch `main` tanpa file konfigurasi Vercel tambahan.

1. Buka [Vercel](https://vercel.com/new) dan login dengan akun GitHub yang memiliki akses ke repository ini.
2. Pilih repository `Kevinardhana096/website-umkm-minasa-upa` lalu klik **Import**.
3. Pastikan Framework Preset terdeteksi sebagai **Next.js**, Root Directory kosong, dan Production Branch adalah `main`.
4. Pada **Environment Variables**, tambahkan untuk environment **Production** dan **Preview**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

5. Klik **Deploy**. Vercel akan menjalankan `npm run build` secara otomatis.
6. Setelah mendapat URL production, misalnya `https://website-umkm-minasa-upa.vercel.app`, buka Supabase **Authentication → URL Configuration** lalu:
   - isi **Site URL** dengan URL production tersebut;
   - tambahkan `https://website-umkm-minasa-upa.vercel.app/auth/callback` ke **Redirect URLs**;
   - pertahankan `http://localhost:3000/auth/callback` untuk development lokal.

Untuk deployment preview Vercel, tambahkan pola `https://*-<slug-akun-atau-tim>.vercel.app/**` ke Redirect URLs Supabase. Gunakan URL production yang tepat untuk Site URL agar reset password selalu mengarah ke website publik yang benar.

Jangan memasukkan service-role key, password, atau secret provider AI ke Vercel sebagai variabel `NEXT_PUBLIC_*`.
