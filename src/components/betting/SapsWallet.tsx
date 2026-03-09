"use client";

import { useState } from 'react'
import { Coins, TrendingUp, TrendingDown, Plus, Loader2 } from "lucide-react";
import { useSapsStore } from "@/store/useSapsStore";

export default function SapsWallet() {
  const { balance, addSaps } = useSapsStore()
  const [isToppingUp, setIsToppingUp] = useState(false)

  const handleTopUp = async () => {
     setIsToppingUp(true)
     // Simulate a top-up network request
     await new Promise(resolve => setTimeout(resolve, 800))
     addSaps(500) // Give 500 SAPS
     setIsToppingUp(false)
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20">
             <Coins className="h-4 w-4 text-blue-400" />
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            SAPS Wallet
          </h2>
        </div>
        <button 
           onClick={handleTopUp}
           disabled={isToppingUp}
           className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
        >
           {isToppingUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
           Top Up
        </button>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-5 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 z-10">Available Balance</p>
        <div className="flex items-baseline gap-2 z-10">
          <span className="text-4xl font-black text-white">{balance.toLocaleString()}</span>
          <span className="text-sm font-bold text-blue-400">SAPS</span>
        </div>
      </div>
    </div>
  );
}
