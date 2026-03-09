import { Trophy, Coins, Users, TrendingUp } from "lucide-react";

const stats = [
  { label: "Active Tournaments", value: "12", icon: Trophy },
  { label: "Open Bets", value: "34", icon: Coins },
  { label: "Players Online", value: "128", icon: Users },
  { label: "SAPS Volume (24h)", value: "4,200", icon: TrendingUp },
];

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
        Dashboard
      </h1>
      <p className="text-zinc-500 mb-8">Welcome back to Showdown Central.</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-zinc-500">{label}</span>
              <Icon className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
