'use client'

import { useState } from 'react'
import { Coins, AlertCircle, X, Check } from 'lucide-react'
import { useSapsStore } from '@/store/useSapsStore'
import { MatchupNode, Team } from '@/store/useTournamentStore'

interface BetModalProps {
  isOpen: boolean
  onClose: () => void
  tournamentId: string | null
  matchup: MatchupNode | null
  teamA: Team | null
  teamB: Team | null
}

export default function BetModal({ isOpen, onClose, tournamentId, matchup, teamA, teamB }: BetModalProps) {
  const { balance, deductSaps } = useSapsStore()
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [wagerAmount, setWagerAmount] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen || !matchup) return null

  // Mock odds for demonstration. Will come from DB.
  const oddsA = 1.85
  const oddsB = 2.05

  const handlePlaceBet = async () => {
    setError(null)
    const amount = parseInt(wagerAmount)

    if (!selectedTeam) {
       setError("Please select a team to win.")
       return
    }
    if (isNaN(amount) || amount <= 0) {
       setError("Please enter a valid wager amount.")
       return
    }
    if (amount > balance) {
       setError("Insufficient SAPS balance.")
       return
    }

    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchup_id: matchup?.id,
          team_id: selectedTeam,
          amount,
          odds_at_bet: selectedTeam === teamA?.id ? oddsA : oddsB
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place bet')
      }

      // Deduct locally and show success
      useSapsStore.getState().setBalance(data.newBalance || (balance - amount))
      
      setSuccess(true)
      setTimeout(() => {
         setSuccess(false)
         setSelectedTeam(null)
         setWagerAmount('')
         onClose()
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const potentialPayout = parseInt(wagerAmount) > 0 
      ? Math.floor(parseInt(wagerAmount) * (selectedTeam === teamA?.id ? oddsA : oddsB))
      : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-2xl w-full max-w-md relative flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
         <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
         </button>

         <div className="text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Place Wager</h2>
            <p className="text-slate-400 text-sm mt-1">Predict the winner of this matchup</p>
         </div>

         {success ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-emerald-400">
               <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                  <Check className="w-8 h-8" />
               </div>
               <p className="font-bold text-lg">Bet Placed Successfully!</p>
            </div>
         ) : (
            <>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                     onClick={() => setSelectedTeam(teamA?.id || null)}
                     disabled={!teamA}
                     className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${selectedTeam === teamA?.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                     <span className="font-bold text-slate-200 text-center truncate w-full">{teamA?.name || 'TBD'}</span>
                     <span className="text-emerald-400 font-mono font-bold mt-2">{oddsA}x</span>
                  </button>

                  <button 
                     onClick={() => setSelectedTeam(teamB?.id || null)}
                     disabled={!teamB}
                     className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${selectedTeam === teamB?.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                     <span className="font-bold text-slate-200 text-center truncate w-full">{teamB?.name || 'TBD'}</span>
                     <span className="text-emerald-400 font-mono font-bold mt-2">{oddsB}x</span>
                  </button>
               </div>

               <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                     <span className="text-slate-400">Wager Amount</span>
                     <span className="text-emerald-400 flex items-center gap-1"><Coins className="w-3 h-3" /> {balance} Available</span>
                  </div>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-bold">S</span>
                     </div>
                     <input 
                        type="number" 
                        value={wagerAmount}
                        onChange={(e) => setWagerAmount(e.target.value)}
                        placeholder="100"
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

               <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-semibold">To Win:</span>
                  <span className="text-emerald-400 font-bold text-xl flex items-center gap-1">
                     <Coins className="w-5 h-5" /> {potentialPayout}
                  </span>
               </div>

               <button 
                  onClick={handlePlaceBet}
                  disabled={isSubmitting || !selectedTeam || !wagerAmount}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg transition-all uppercase tracking-widest text-sm"
               >
                  {isSubmitting ? 'Processing...' : 'Lock In Wager'}
               </button>
            </>
         )}
      </div>
    </div>
  )
}
