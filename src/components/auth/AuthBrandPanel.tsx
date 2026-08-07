import { CheckCircle2 } from "lucide-react";
import { InstitutionalLogos } from "@/components/InstitutionalLogos";

export function AuthBrandPanel() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-[#0F2C23] p-8 text-white sm:p-12 lg:w-[45%]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#184537] opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#963E1B] opacity-30 blur-3xl" />

      <div className="relative z-10 space-y-6">

        <div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Digitalisasi usaha lokal Anda.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-300">
            Kelola katalog produk dengan mudah dan hubungkan pembeli langsung ke WhatsApp usaha Anda.
          </p>
        </div>

        <div className="space-y-3.5 pt-2">
          {[
            "Katalog produk digital responsif",
            "Pesanan terhubung langsung ke WhatsApp",
            "Siap dikembangkan dengan asisten AI",
          ].map((benefit) => (
            <div key={benefit} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs text-gray-200">{benefit}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-8 border-t border-white/10 pt-6 space-y-3">
        <div>
          <p className="text-xs font-bold text-white">Didukung Oleh Mitra Resmi</p>
          <p className="mt-0.5 text-[11px] text-gray-300">Kementerian & Perguruan Tinggi Mitra Program</p>
        </div>
        <div className="pt-1">
          <InstitutionalLogos imageClassName="h-7 sm:h-9 md:h-10 w-auto object-contain" />
        </div>
      </div>
    </div>
  );
}
