"use client";

import { useState } from "react";
import { Coins } from "lucide-react";

interface Matchup {
  id: string;
  tournamentName: string;
  teamA: string;
  teamB: string;
  oddsA: number;
  oddsB: number;
}

interface BettingSlipProps {
  matchup: Matchup;
}

export default function BettingSlip({ matchup }: BettingSlipProps) {
  const [selectedTeam, setSelectedTeam] = useState<"A" | "B" | null>(null);
  const [amount, setAmount] = useState("");

  const selectedOdds =
    selectedTeam === "A"
      ? matchup.oddsA
      : selectedTeam === "B"
        ? matchup.oddsB
        : null;

  const potentialReturn = selectedOdds
    ? (parseFloat(amount || "0") * selectedOdds).toFixed(2)
    : "—";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 mb-3">
        {matchup.tournamentName}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { side: "A" as const, team: matchup.teamA, odds: matchup.oddsA },
          { side: "B" as const, team: matchup.teamB, odds: matchup.oddsB },
        ].map(({ side, team, odds }) => (
          <button
            key={side}
            onClick={() => setSelectedTeam(side)}
            className={`rounded-lg border px-4 py-3 text-left transition-colors ${
              selectedTeam === side
                ? "border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950"
                : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
            }`}
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {team}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Odds: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{odds}x</span>
            </p>
          </button>
        ))}
      </div>

      {selectedTeam && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2">
            <Coins className="h-4 w-4 text-zinc-400 shrink-0" />
            <input
              type="number"
              min={1}
              placeholder="Bet amount (SAPS)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Potential return</span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {potentialReturn} SAPS
            </span>
          </div>
          <button
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Place Bet
          </button>
        </div>
      )}
    </div>
  );
}
