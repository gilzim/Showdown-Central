import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/providers/SupabaseProvider";
import GlobalModal from "@/components/providers/GlobalModal";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Showdown Central",
  description: "Host and manage your own brackets globally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.className} antialiased min-h-screen bg-slate-900 text-slate-50`}
      >
        <SupabaseProvider>
          {children}
          <GlobalModal />
        </SupabaseProvider>
      </body>
    </html>
  );
}
