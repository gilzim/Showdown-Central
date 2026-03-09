"use client";

import { useState } from "react";
import { Coins, AlertCircle, Loader2 } from "lucide-react";
import { useSapsStore } from "@/store/useSapsStore";

export interface BettingSlipProps {
  tournamentId: string;
  tournamentName: string;
  matchupId: string;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  oddsA?: number;
  oddsB?: number;
  onSuccess?: () => void;
}

export default function BettingSlip({
  tournamentId,
  tournamentName,
  matchupId,
  teamA,
  teamB,
  oddsA = 1.85,
  oddsB = 2.05,
  onSuccess
}: BettingSlipProps) {
  const { balance, setBalance } = useSapsStore();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOdds = selectedTeam === teamA.id ? oddsA : selectedTeam === teamB.id ? oddsB : null;
  const potentialReturn = selectedOdds ? Math.floor(parseFloat(amount || "0") * selectedOdds) : 0;

  const handlePlaceBet = async () => {
    setError(null);
    const wagerAmount = parseInt(amount);

    if (!selectedTeam) return setError("Please select a team.");
    if (isNaN(wagerAmount) || wagerAmount <= 0) return setError("Invalid amount.");
    if (wagerAmount > balance) return setError("Insufficient balance.");

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchup_id: matchupId,
          team_id: selectedTeam,
          amount: wagerAmount,
          odds_at_bet: selectedOdds
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }

      setBalance(data.newBalance || (balance - wagerAmount));
      setAmount("");
      setSelectedTeam(null);
      if (onSuccess) onSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl p-5 shadow-xl">
      <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 truncate">
        {tournamentName}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setSelectedTeam(teamA.id)}
          className={`rounded-lg border-2 px-4 py-3 text-left transition-all ${
            selectedTeam === teamA.id
              ? "border-blue-500 bg-blue-500/10"
              : "border-slate-700 bg-slate-900/50 hover:border-slate-500"
          }`}
        >
          <p className="text-sm font-bold text-white truncate">{teamA.name}</p>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Odds: <span className="font-bold text-emerald-400">{oddsA}x</span>
          </p>
        </button>

        <button
          onClick={() => setSelectedTeam(teamB.id)}
          className={`rounded-lg border-2 px-4 py-3 text-left transition-all ${
            selectedTeam === teamB.id
              ? "border-blue-500 bg-blue-500/10"
              : "border-slate-700 bg-slate-900/50 hover:border-slate-500"
          }`}
        >
          <p className="text-sm font-bold text-white truncate">{teamB.name}</p>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Odds: <span className="font-bold text-emerald-400">{oddsB}x</span>
          </p>
        </button>
      </div>

      {selectedTeam && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2">
             <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <span>Wager Amount</span>
                <span className="text-emerald-400 flex items-center gap-1"><Coins className="w-3 h-3" /> {balance} Available</span>
             </div>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <span className="text-slate-500 font-bold">S</span>
                </div>
                <input
                  type="number"
                  min={1}
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 focus:border-blue-500 rounded-lg pl-8 pr-4 py-3 outline-none transition-all font-bold text-white placeholder:text-slate-600"
                />
             </div>
          </div>

          {error && (
             <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-sm border border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
             </div>
          )}

          <div className="bg-slate-900/50 p-3 flex rounded-lg border border-slate-700 items-center justify-between text-sm">
            <span className="text-slate-400 font-semibold">To Win:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1 text-lg">
              <Coins className="w-4 h-4" /> {potentialReturn}
            </span>
          </div>
          
          <button
            onClick={handlePlaceBet}
            disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Wager'}
          </button>
        </div>
      )}
    </div>
  );
}
