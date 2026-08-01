import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBFBF9] px-4 py-8">
      <div className="w-full max-w-lg rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-xl sm:p-12">
        <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-lg tracking-tight text-gray-900">
          <Image src="/logo_umkm.png" alt="Logo UMKM" width={36} height={36} className="h-9 w-auto object-contain" />
          UMKM <span className="text-[#0F2C23]">Wanita Tangguh Minasa Upa</span>
        </Link>
        <h1 className="mt-10 text-2xl font-extrabold tracking-tight text-gray-900">Pendaftaran Pengelola</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Pendaftaran anggota dilakukan melalui pengelola UMKM Wania Tangguh.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="rounded-xl bg-[#0F2C23] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#184537]">
            Login Pengelola
          </Link>
          <Link href="/" className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50">
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    </main>
  );
}
