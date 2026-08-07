"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRightLeft, Loader2, Search, X } from "lucide-react";
import type { AdminProductSummary } from "@/lib/admin-service";

interface MemberAccount {
  id: string;
  email: string;
  full_name: string;
  role: "anggota";
  banned_until: string | null;
}

interface TransferProductModalProps {
  products: AdminProductSummary[];
  isSubmitting: boolean;
  onClose: () => void;
  onTransfer: (targetUserId: string) => Promise<void>;
}

function isBanned(user: MemberAccount) {
  if (!user.banned_until) return false;
  const time = new Date(user.banned_until).getTime();
  return !Number.isNaN(time) && time > Date.now();
}

export function TransferProductModal({ products, isSubmitting, onClose, onTransfer }: TransferProductModalProps) {
  const [members, setMembers] = useState<MemberAccount[]>([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const loadMembers = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await fetch("/api/admin/users", { cache: "no-store", signal: controller.signal });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Daftar akun anggota gagal dimuat.");
        setMembers((payload.users ?? []).filter((user: MemberAccount) => user.role === "anggota" && !isBanned(user)));
      } catch (error) {
        if (!controller.signal.aborted) setErrorMessage(error instanceof Error ? error.message : "Daftar akun anggota gagal dimuat.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    void loadMembers();
    return () => controller.abort();
  }, []);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return !query ? members : members.filter((member) => [member.full_name, member.email].some((value) => value.toLowerCase().includes(query)));
  }, [members, searchQuery]);

  const handleSubmit = async () => {
    if (!targetUserId) return setErrorMessage("Pilih akun anggota tujuan terlebih dahulu.");
    setErrorMessage("");
    try {
      await onTransfer(targetUserId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Produk gagal ditransfer.");
    }
  };

  const productLabel = products.length === 1 ? products[0]?.name : `${products.length} produk terpilih`;
  const stores = [...new Set(products.map((product) => product.store_name))];

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="transfer-product-title">
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5"><div><div className="flex items-center gap-2 text-[#0F2C23]"><ArrowRightLeft className="h-5 w-5" /><p className="text-xs font-extrabold uppercase tracking-wider">Akses produk</p></div><h2 id="transfer-product-title" className="mt-1 text-xl font-black text-gray-900">Transfer Produk</h2></div><button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50" aria-label="Tutup"><X className="h-5 w-5" /></button></div>
      <div className="space-y-5 p-5">
        <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">Produk yang dipindahkan</p><p className="mt-1 font-bold text-gray-900">{productLabel}</p>{products.length > 1 && <ul className="mt-2 max-h-24 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-gray-600">{products.map((product) => <li key={product.id}>{product.name}</li>)}</ul>}<p className="mt-3 text-xs font-bold uppercase tracking-wide text-gray-500">Toko tetap</p><p className="mt-1 text-sm font-semibold text-gray-700">{stores.join(", ")}</p></div>
        <div><label htmlFor="member-search" className="text-sm font-bold text-gray-800">Akun anggota tujuan</label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input id="member-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari nama atau email..." className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0F2C23]" /></div><select value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} disabled={isLoading || isSubmitting} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#0F2C23] disabled:cursor-not-allowed disabled:opacity-60"><option value="">{isLoading ? "Memuat akun anggota..." : "Pilih akun anggota"}</option>{filteredMembers.map((member) => <option key={member.id} value={member.id}>{member.full_name ? `${member.full_name} — ${member.email}` : member.email}</option>)}</select>{!isLoading && filteredMembers.length === 0 && <p className="mt-2 text-sm text-gray-500">Tidak ada akun anggota aktif yang cocok.</p>}</div>
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>Akun tujuan dapat mengedit dan menghapus produk ini dari katalog. Kepemilikan toko, harga, dan status produk tidak berubah.</p></div>
        {errorMessage && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700">{errorMessage}</p>}
      </div>
      <div className="flex justify-end gap-3 border-t border-gray-100 p-5"><button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Batal</button><button type="button" onClick={() => void handleSubmit()} disabled={!targetUserId || isLoading || isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-[#0F2C23] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#184537] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}{isSubmitting ? "Memindahkan..." : "Konfirmasi Transfer"}</button></div>
    </div>
  </div>;
}
