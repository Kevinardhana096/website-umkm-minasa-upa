"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Eye, EyeOff, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";

interface HeroSlide {
  id: string;
  image_path: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
}

export function AdminHeroCarousel() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [maxSlides, setMaxSlides] = useState(6);
  const [altText, setAltText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadSlides = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/admin/hero-slides", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Data carousel Hero gagal dimuat.");
      setSlides(payload.slides ?? []);
      setMaxSlides(payload.max_slides ?? 6);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Data carousel Hero gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSlides(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSlides]);

  const uploadSlide = async () => {
    if (!imageFile) return setErrorMessage("Pilih foto Hero terlebih dahulu.");
    setPendingAction("upload");
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const formData = new FormData();
      formData.append("image_file", imageFile);
      formData.append("alt_text", altText);
      const response = await fetch("/api/admin/hero-slides", { method: "POST", body: formData });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Foto Hero gagal ditambahkan.");
      setImageFile(null);
      setAltText("");
      setSuccessMessage("Foto Hero berhasil ditambahkan.");
      await loadSlides();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Foto Hero gagal ditambahkan.");
    } finally {
      setPendingAction(null);
    }
  };

  const saveSlide = async (slide: HeroSlide) => {
    setPendingAction(`${slide.id}:save`);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/admin/hero-slides", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", id: slide.id, alt_text: slide.alt_text, is_active: slide.is_active }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Slide Hero gagal diperbarui.");
      setSuccessMessage("Pengaturan slide berhasil disimpan.");
      await loadSlides();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Slide Hero gagal diperbarui.");
    } finally {
      setPendingAction(null);
    }
  };

  const deleteSlide = async (slide: HeroSlide) => {
    if (!window.confirm("Hapus foto Hero ini? Tindakan tidak dapat dipulihkan.")) return;
    setPendingAction(`${slide.id}:delete`);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/admin/hero-slides", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: slide.id }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Slide Hero gagal dihapus.");
      setSuccessMessage("Foto Hero berhasil dihapus.");
      await loadSlides();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Slide Hero gagal dihapus.");
    } finally {
      setPendingAction(null);
    }
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    setSlides((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((slide, position) => ({ ...slide, sort_order: position }));
    });
  };

  const saveOrder = async () => {
    setPendingAction("reorder");
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch("/api/admin/hero-slides", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reorder", slide_ids: slides.map((slide) => slide.id) }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Urutan slide gagal disimpan.");
      setSuccessMessage("Urutan carousel Hero berhasil disimpan.");
      await loadSlides();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Urutan slide gagal disimpan.");
    } finally {
      setPendingAction(null);
    }
  };

  const changeFile = (event: ChangeEvent<HTMLInputElement>) => setImageFile(event.target.files?.[0] ?? null);

  return <section className="space-y-6">
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="text-lg font-extrabold text-gray-900">Carousel Hero</h2><p className="mt-1 text-sm text-gray-500">Atur foto besar yang tampil bergantian pada halaman Beranda dan Profil. Maksimal {maxSlides} foto.</p></div>
    {errorMessage && <div role="alert" className="flex gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{errorMessage}</div>}
    {successMessage && <div role="status" className="flex gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{successMessage}</div>}
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h3 className="font-extrabold text-gray-900">Tambah Foto Hero</h3><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.3fr_auto]"><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:border-[#0F2C23]"><ImagePlus className="h-4 w-4" /><span className="truncate">{imageFile?.name ?? "Pilih foto JPG, PNG, atau WebP"}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={changeFile} className="sr-only" /></label><input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Deskripsi singkat foto (opsional)" className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F2C23]" /><button type="button" onClick={() => void uploadSlide()} disabled={!imageFile || Boolean(pendingAction) || slides.length >= maxSlides} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2C23] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#184537] disabled:cursor-not-allowed disabled:opacity-60">{pendingAction === "upload" && <Loader2 className="h-4 w-4 animate-spin" />}Tambah</button></div>{slides.length >= maxSlides && <p className="mt-3 text-xs font-semibold text-amber-700">Batas jumlah foto Hero telah tercapai. Hapus satu foto sebelum menambah foto baru.</p>}</section>
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center"><div><h3 className="font-extrabold text-gray-900">Urutan dan Status Foto</h3><p className="mt-1 text-xs text-gray-500">Gunakan tombol panah untuk menentukan urutan tampil.</p></div><button type="button" onClick={() => void saveOrder()} disabled={isLoading || Boolean(pendingAction) || slides.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0F2C23] px-3 py-2 text-sm font-bold text-[#0F2C23] hover:bg-[#E8F3EF] disabled:opacity-50"><Save className="h-4 w-4" />{pendingAction === "reorder" ? "Menyimpan..." : "Simpan Urutan"}</button></div>
      {isLoading ? <div className="p-10 text-center text-sm text-gray-500">Memuat carousel Hero...</div> : slides.length === 0 ? <div className="p-10 text-center text-sm text-gray-500">Belum ada foto Hero.</div> : <div className="divide-y divide-gray-100">{slides.map((slide, index) => <article key={slide.id} className="grid gap-4 p-4 sm:grid-cols-[132px_1fr_auto] sm:items-center"><img src={slide.image_url} alt={slide.alt_text || "Preview slide Hero"} className="h-28 w-full rounded-xl object-cover bg-gray-100 sm:w-32" /><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">Urutan {index + 1}</span>{slide.is_active ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><Eye className="h-3.5 w-3.5" /> Aktif</span> : <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500"><EyeOff className="h-3.5 w-3.5" /> Nonaktif</span>}</div><input value={slide.alt_text} onChange={(event) => setSlides((current) => current.map((item) => item.id === slide.id ? { ...item, alt_text: event.target.value } : item))} placeholder="Deskripsi foto" className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0F2C23]" /><label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={slide.is_active} onChange={(event) => setSlides((current) => current.map((item) => item.id === slide.id ? { ...item, is_active: event.target.checked } : item))} />Tampilkan di carousel</label></div><div className="flex flex-wrap gap-2 sm:w-28 sm:justify-end"><button type="button" onClick={() => moveSlide(index, -1)} disabled={index === 0 || Boolean(pendingAction)} className="rounded-lg border border-gray-200 p-2 text-gray-700 disabled:opacity-40" aria-label="Naikkan urutan"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => moveSlide(index, 1)} disabled={index === slides.length - 1 || Boolean(pendingAction)} className="rounded-lg border border-gray-200 p-2 text-gray-700 disabled:opacity-40" aria-label="Turunkan urutan"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => void saveSlide(slide)} disabled={Boolean(pendingAction)} className="rounded-lg border border-[#0F2C23] p-2 text-[#0F2C23] disabled:opacity-40" aria-label="Simpan slide"><Save className="h-4 w-4" /></button><button type="button" onClick={() => void deleteSlide(slide)} disabled={Boolean(pendingAction)} className="rounded-lg border border-rose-200 p-2 text-rose-700 disabled:opacity-40" aria-label="Hapus slide"><Trash2 className="h-4 w-4" /></button></div></article>)}</div>}</section>
  </section>;
}
