import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Showdown Central",
  description: "Generic Tournament & Betting Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
          {children}
        </main>
      </body>
    </html>
  );
}
