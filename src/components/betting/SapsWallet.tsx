"use client";

import { useState, useEffect } from 'react'
import { Coins, Plus, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useSapsStore } from "@/store/useSapsStore";

interface Transaction {
  id: string
  type: string
  amount: number
  description: string | null
  created_at: string
}

export default function SapsWallet() {
  const { balance, addSaps } = useSapsStore()
  const [isToppingUp, setIsToppingUp] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTx, setIsLoadingTx] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch('/api/transactions')
        if (res.ok) {
          const data = await res.json()
          setTransactions(data.transactions || [])
        }
      } catch {
        // Silently fail — wallet still works without history
      } finally {
        setIsLoadingTx(false)
      }
    }
    fetchTransactions()
  }, [balance])

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

      <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-5 flex flex-col items-center justify-center relative overflow-hidden group mb-4">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 z-10">Available Balance</p>
        <div className="flex items-baseline gap-2 z-10">
          <span className="text-4xl font-black text-white">{balance.toLocaleString()}</span>
          <span className="text-sm font-bold text-blue-400">SAPS</span>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Recent Transactions
        </h3>
        {isLoadingTx ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-3">No transactions yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${tx.amount >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {tx.amount >= 0
                      ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                      : <TrendingDown className="w-3 h-3 text-red-400" />
                    }
                  </span>
                  <span className="text-slate-400 truncate">{tx.description || tx.type}</span>
                </div>
                <span className={`font-bold shrink-0 ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
