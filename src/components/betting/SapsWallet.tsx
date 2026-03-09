"use client";

import { Coins, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { useStore } from "@/store/useStore";

const recentTransactions = [
  { id: "tx1", type: "win" as const, label: "Bet Win — Summer Slam QF", amount: 180 },
  { id: "tx2", type: "loss" as const, label: "Bet Loss — Spring Showdown", amount: -50 },
  { id: "tx3", type: "deposit" as const, label: "Daily Login Bonus", amount: 25 },
];

export default function SapsWallet() {
  const sapsBalance = useStore((s) => s.userProfile.saps_balance);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Coins className="h-5 w-5 text-indigo-500" />
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
          SAPS Wallet
        </h2>
      </div>

      <div className="rounded-lg bg-indigo-600 p-4 text-white mb-4">
        <p className="text-xs font-medium opacity-80 mb-1">Available Balance</p>
        <p className="text-3xl font-bold">{sapsBalance.toLocaleString()}</p>
        <p className="text-xs opacity-70 mt-0.5">SAPS</p>
      </div>

      <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors mb-5">
        <ArrowUpRight className="h-4 w-4" />
        Top Up
      </button>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">
          Recent Transactions
        </h3>
        <ul className="space-y-2">
          {recentTransactions.map(({ id, type, label, amount }) => (
            <li
              key={id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                {type === "win" || type === "deposit" ? (
                  <TrendingUp className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 shrink-0 text-red-500" />
                )}
                <span className="truncate text-zinc-700 dark:text-zinc-300">
                  {label}
                </span>
              </div>
              <span
                className={`shrink-0 font-semibold ${
                  amount > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {amount > 0 ? "+" : ""}
                {amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
