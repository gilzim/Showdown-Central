import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/providers/SupabaseProvider";
import Sidebar from "@/components/Sidebar";

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
        className={`${outfit.className} antialiased min-h-screen bg-slate-900 text-slate-50 flex`}
      >
        <SupabaseProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col items-center p-4 sm:p-10 overflow-y-auto">
            {children}
          </main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
