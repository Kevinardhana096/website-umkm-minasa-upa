export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-[#FBFBF9] px-6" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F2C23]/20 border-t-[#0F2C23]" aria-hidden="true" />
        <p className="text-sm font-semibold text-gray-600">Menyiapkan halaman...</p>
      </div>
    </main>
  );
}
