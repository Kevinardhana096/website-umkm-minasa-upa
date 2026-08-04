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
5. Jalankan isi `supabase/admin-dashboard.sql` setelah akun admin tersedia agar admin dapat membaca seluruh toko dan produk.
6. Jalankan isi `supabase/role-hardening.sql` agar hanya role `toko` yang dapat membuat atau mengubah toko, produk, dan foto.
7. Jalankan isi `supabase/product-gallery.sql` untuk mengaktifkan galeri multi-gambar dan melakukan backfill gambar lama.
8. Jalankan isi `supabase/atomic-product-write.sql` agar produk dan galeri disimpan dalam satu transaksi database.
9. Jalankan isi `supabase/admin-audit.sql` untuk menyimpan jejak perubahan katalog dan user oleh admin.
10. Untuk project yang sudah ada, jalankan `supabase/storage-hardening.sql` agar bucket membatasi file maksimal 5 MB dan hanya menerima JPG, PNG, atau WebP.
11. Aktifkan Email provider pada Authentication → Providers untuk login email/password.
12. Pada Authentication → Providers → Email, nonaktifkan **Allow new users to sign up** dan **Confirm Email**. Akun toko hanya dibuat oleh pengelola melalui proses internal dan dapat login tanpa verifikasi email.

Pada Authentication → URL Configuration, tambahkan `http://localhost:3000/auth/callback` ke Redirect URLs. Untuk production, tambahkan juga URL domain production dengan path yang sama. Alur lupa kata sandi memakai callback `/auth/callback` lalu mengarahkan pengguna ke `/reset-password`.

Client Supabase tersedia di `src/lib/supabase/client.ts` untuk Client Components dan `src/lib/supabase/server.ts` untuk Server Components, Server Actions, serta Route Handlers. `src/proxy.ts` menjaga sesi Auth berbasis cookie tetap diperbarui.

Jangan memasukkan secret/service-role key ke variabel `NEXT_PUBLIC_*` atau ke kode browser.

## Chat katalog

Chat katalog menggunakan endpoint server `/api/chat`. Pertanyaan tentang harga, ketersediaan, dan kontak dijawab langsung dari data katalog publik. Profil publik Desa Minasa Upa, kelompok UMKM, produk, dan kondisi usaha diambil dari knowledge terkurasi proyek; pertanyaan yang meminta informasi terbaru memakai Google Search grounding Gemini lalu Mistral `web_search` sebagai fallback. Pertanyaan bebas lainnya dapat diteruskan ke rangkaian provider AI yang kompatibel dengan format OpenAI Chat Completions.

Tanpa konfigurasi provider AI, chat tetap berfungsi menggunakan retrieval katalog dan fallback rule-based. Untuk mengaktifkan fallback Gemini → Mistral, tambahkan key dan model provider yang diperlukan ke `.env.local` atau Environment Variables Vercel, lalu restart/deploy aplikasi:

```env
AI_CHAT_PROVIDER_ORDER=gemini,mistral
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
GEMINI_API_KEY=server-only-gemini-key
GEMINI_MODEL=your-gemini-model
MISTRAL_API_KEY=server-only-mistral-key
MISTRAL_MODEL=your-mistral-model
# Opsional: fallback web search native Mistral
MISTRAL_CONVERSATIONS_API_URL=https://api.mistral.ai/v1/conversations
# MISTRAL_WEB_SEARCH_MODEL=your-mistral-web-search-model
```

Konfigurasi lama `AI_CHAT_API_URL`, `AI_CHAT_API_KEY`, dan `AI_CHAT_MODEL` tetap diterima sebagai konfigurasi Gemini utama. Semua API key tidak boleh menggunakan awalan `NEXT_PUBLIC_` dan tidak pernah dikirim ke browser. Knowledge profil dipakai untuk pertanyaan statis; angka profil diberi konteks sebagai snapshot dokumen dan bukan data real-time. Pertanyaan terbaru memakai native Gemini `generateContent` dengan `google_search`; jika gagal, sistem mencoba Mistral Conversations API dengan `web_search`. Keduanya memiliki timeout 12 detik dan mengembalikan maksimal 5 sumber. Endpoint membatasi pertanyaan maksimal 800 karakter, sekitar 20 request per alamat IP per menit, dan waktu tunggu provider 8 detik.

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

Setelah login sebagai admin, halaman `/admin` menyediakan monitoring toko dan produk secara menyeluruh, edit profil toko lintas toko, edit/hapus produk lintas toko, serta menu **Manajemen user** untuk membuat user toko/admin, mengubah role, menonaktifkan atau mengaktifkan akses login, dan mereset password. Fitur mutation admin dan pencatatan audit memakai `SUPABASE_SERVICE_ROLE_KEY` di Route Handler server; tambahkan key tersebut ke `.env.local` saat development atau ke Environment Variables Vercel (tanpa awalan `NEXT_PUBLIC_`) bila fitur ini dipakai di production. Tabel audit dapat dibaca oleh admin melalui policy RLS, sedangkan penulisannya hanya dilakukan oleh route server. Jangan pernah mengekspos atau memasukkan key tersebut ke kode browser.

Pada dashboard toko, menu **Pengaturan Toko** dapat digunakan untuk mengubah nama usaha, nama pengelola, deskripsi, nomor WhatsApp, dan status tampil toko di katalog publik.

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
   # Hanya jika menu Manajemen user admin digunakan:
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   # Opsional untuk mengaktifkan AI chat dan fallback provider:
   AI_CHAT_PROVIDER_ORDER=gemini,mistral
   GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
   GEMINI_API_KEY=server-only-gemini-key
   GEMINI_MODEL=your-gemini-model
   MISTRAL_API_KEY=server-only-mistral-key
   MISTRAL_MODEL=your-mistral-model
   MISTRAL_CONVERSATIONS_API_URL=https://api.mistral.ai/v1/conversations
   # Opsional bila model chat berbeda dengan model web search:
   # MISTRAL_WEB_SEARCH_MODEL=your-mistral-web-search-model
   ```

5. Klik **Deploy**. Vercel akan menjalankan `npm run build` secara otomatis.
6. Setelah mendapat URL production, misalnya `https://website-umkm-minasa-upa.vercel.app`, buka Supabase **Authentication → URL Configuration** lalu:
   - isi **Site URL** dengan URL production tersebut;
   - tambahkan `https://website-umkm-minasa-upa.vercel.app/auth/callback` ke **Redirect URLs**;
   - pertahankan `http://localhost:3000/auth/callback` untuk development lokal.

Untuk deployment preview Vercel, tambahkan pola `https://*-<slug-akun-atau-tim>.vercel.app/**` ke Redirect URLs Supabase. Gunakan URL production yang tepat untuk Site URL agar reset password selalu mengarah ke website publik yang benar.

Jangan memasukkan service-role key, password, atau secret provider AI ke Vercel sebagai variabel `NEXT_PUBLIC_*`.
