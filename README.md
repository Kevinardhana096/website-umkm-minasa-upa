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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
