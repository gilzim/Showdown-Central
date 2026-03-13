"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Trophy, Coins, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/betting", label: "Betting", icon: Coins },
  { href: "/profile", label: "Profile", icon: User },
];

const AUTH_PATHS = ["/login", "/auth"];

export default function Sidebar() {
  const pathname = usePathname();

  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <aside className="flex h-screen w-60 flex-col bg-slate-900 border-r border-slate-800 text-white sticky top-0 shrink-0">
      <div className="px-6 py-5 text-xl font-bold tracking-tight border-b border-slate-800">
        Showdown Central
      </div>
      <nav className="flex flex-col gap-1 p-4 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
