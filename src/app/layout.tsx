import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UMKM Wanita Tangguh Minasa Upa",
  description: "Katalog produk UMKM Wanita Tangguh Minasa Upa.",
  icons: {
    icon: "/logo_umkm.png",
    shortcut: "/logo_umkm.png",
    apple: "/logo_umkm.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
