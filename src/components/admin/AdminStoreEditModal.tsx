"use client";

import { X } from "lucide-react";
import type { AdminStoreSummary } from "@/lib/admin-service";
import { StoreProfileForm } from "@/components/dashboard/StoreProfileForm";
import type { StoreProfileInput } from "@/lib/store-service";

interface AdminStoreEditModalProps {
  store: AdminStoreSummary | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: StoreProfileInput) => Promise<void>;
}

export function AdminStoreEditModal({ store, isSaving, onClose, onSave }: AdminStoreEditModalProps) {
  if (!store) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative my-6 w-full max-w-3xl">
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-3 shadow-xl">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#0F2C23]">Edit lintas toko</p>
            <p className="mt-0.5 text-sm font-bold text-gray-900">{store.name}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Tutup edit toko">
            <X className="h-5 w-5" />
          </button>
        </div>
        <StoreProfileForm store={store} isSaving={isSaving} onSave={onSave} />
      </div>
    </div>
  );
}
