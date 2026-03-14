'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Save, X, Coins } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSapsStore } from '@/store/useSapsStore'
import { useUIStore } from '@/store/useUIStore'

interface PropBetOption {
  id: string
  text: string
  odds: number
}

interface PropBet {
  id: string
  tournament_id: string
  question: string
  options: PropBetOption[]
  status: 'open' | 'closed' | 'settled'
  winning_option_id?: string | null
}

interface PropBetsPanelProps {
  tournamentId: string
  isHost: boolean
}

export function PropBetsPanel({ tournamentId, isHost }: PropBetsPanelProps) {
  const [bets, setBets] = useState<PropBet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [placingBetId, setPlacingBetId] = useState<string | null>(null)
  const [wagers, setWagers] = useState<Record<string, number>>({})
  
  const supabase = createClient()
  const { balance, setBalance } = useSapsStore()
  const { showAlert } = useUIStore()

  // New Bet State
  const [newQuestion, setNewQuestion] = useState('')
  const [newOptions, setNewOptions] = useState<PropBetOption[]>([
    { id: '1', text: 'Yes', odds: 1.9 },
    { id: '2', text: 'No', odds: 1.9 }
  ])

  useEffect(() => {
    fetchBets()

    // Realtime subscription
    const channel = supabase
      .channel(`prop-bets-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'prop_bets',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          fetchBets() // Simplified: re-fetch on any change to guarantee correct JSON options
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tournamentId])

  const fetchBets = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('prop_bets')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })

    if (data && !error) {
      setBets(data as PropBet[])
    }
    setIsLoading(false)
  }

  const handleCreateBet = async () => {
    if (!newQuestion || newOptions.some(o => !o.text || !o.odds)) return

    setIsCreating(true)
    const { error } = await supabase
      .from('prop_bets')
      .insert({
        tournament_id: tournamentId,
        question: newQuestion,
        options: newOptions
      })

    if (!error) {
      setNewQuestion('')
      setNewOptions([
        { id: '1', text: 'Yes', odds: 1.9 },
        { id: '2', text: 'No', odds: 1.9 }
      ])
    }
    setIsCreating(false)
  }

  const handleDeleteBet = async (betId: string) => {
    await supabase.from('prop_bets').delete().eq('id', betId)
  }

  const handleUpdateStatus = async (betId: string, status: 'open' | 'closed') => {
    await supabase.from('prop_bets').update({ status }).eq('id', betId)
  }

  const handlePlaceWager = async (bet: PropBet, option: PropBetOption) => {
     const wagerAmount = wagers[bet.id] || 0
     if (wagerAmount <= 0) return showAlert('Invalid Amount', 'Please enter a valid wager amount.', 'OK', 'info', 'AlertCircle')
     if (balance < wagerAmount) return showAlert('Insufficient Balance', 'Insufficient SAPS balance.', 'OK', 'danger', 'AlertTriangle')

     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return showAlert('Authentication Required', 'You must be logged in to place a bet.', 'OK', 'danger', 'Key')

     setPlacingBetId(option.id)

     try {
       const res = await fetch('/api/bets/prop', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           bettorId: user.id,
           propBetId: bet.id,
           optionId: option.id,
           amount: wagerAmount,
           odds: option.odds
         })
       })

       if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to place bet')
       }
       
       const { newBalance } = await res.json()
       setBalance(newBalance)
       
       // Clear wager input
       setWagers(prev => ({ ...prev, [bet.id]: 0 }))
       showAlert('Bet Placed', `Successfully placed ${wagerAmount} SAPS on "${option.text}"!`, 'Great!', 'success', 'Coins')

     } catch (err: any) {
       showAlert('Error', err.message, 'Dismiss', 'danger', 'AlertTriangle')
     } finally {
       setPlacingBetId(null)
     }
  }

  if (isLoading && bets.length === 0) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  }

  return (
    <div className="flex flex-col gap-6">
      {isHost && (
        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">Create Custom Prop Bet</h3>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Question / Event</label>
              <input 
                type="text"
                placeholder="e.g. Will there be an overtime?"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newOptions.map((opt, index) => (
                <div key={opt.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Option {index + 1}</label>
                    {newOptions.length > 2 && (
                       <button onClick={() => setNewOptions(prev => prev.filter(o => o.id !== opt.id))} className="text-red-400 hover:text-red-300">
                          <X className="w-3 h-3" />
                       </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Outcome"
                      value={opt.text}
                      onChange={(e) => {
                         const updated = [...newOptions]
                         updated[index].text = e.target.value
                         setNewOptions(updated)
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 text-sm"
                    />
                    <div className="relative w-24">
                      <input 
                        type="number"
                        step="0.1"
                        placeholder="Odds"
                        value={opt.odds}
                        onChange={(e) => {
                           const updated = [...newOptions]
                           updated[index].odds = parseFloat(e.target.value) || 1.0
                           setNewOptions(updated)
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-emerald-400 font-bold outline-none focus:border-blue-500 text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-2">
              <button 
                onClick={() => setNewOptions(prev => [...prev, { id: Date.now().toString(), text: '', odds: 2.0 }])}
                className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                 <Plus className="w-4 h-4" /> Add Option
              </button>
              
              <button
                onClick={handleCreateBet}
                disabled={isCreating || !newQuestion || newOptions.some(o => !o.text || !o.odds)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all flex items-center gap-2"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Publish Bet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Prop Bets List */}
      <div className="flex flex-col gap-4">
         {!isHost && (
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-indigo-500" />
               Active Prop Bets
            </h3>
         )}
         
         {bets.length === 0 ? (
            <div className="bg-slate-800/30 border border-slate-700 border-dashed rounded-xl p-8 text-center text-slate-500">
               No prop bets have been created for this tournament yet.
            </div>
         ) : (
            <div className={`grid grid-cols-1 ${isHost ? 'md:grid-cols-2' : ''} gap-4`}>
               {bets.map(bet => (
                  <div key={bet.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg relative flex flex-col">
                     {isHost && bet.status === 'open' && (
                        <button onClick={() => handleDeleteBet(bet.id)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     )}
                     
                     <div className="mb-4 pr-6">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                           bet.status === 'open' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                           bet.status === 'closed' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                           'bg-slate-700 text-slate-400'
                        }`}>
                           {bet.status}
                        </span>
                        <h4 className="text-base font-bold text-white mt-2 leading-snug">{bet.question}</h4>
                     </div>

                     {!isHost && bet.status === 'open' && (
                        <div className="mb-4 relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Coins className="h-4 w-4 text-emerald-500" />
                           </div>
                           <input
                              type="number"
                              placeholder="Wager Amount (SAPS)"
                              value={wagers[bet.id] || ''}
                              onChange={(e) => setWagers(prev => ({ ...prev, [bet.id]: parseInt(e.target.value) || 0 }))}
                              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg pl-10 pr-4 py-2 text-white outline-none transition-colors"
                           />
                        </div>
                     )}

                     <div className="grid grid-cols-2 gap-2 mt-auto">
                        {bet.options.map(opt => (
                           <button 
                              key={opt.id}
                              disabled={bet.status !== 'open' || isHost || placingBetId !== null} // Host can't bet, closed bets can't be bet on
                              onClick={() => handlePlaceWager(bet, opt)}
                              className="bg-slate-900 border border-slate-700 hover:border-indigo-500 px-3 py-2 rounded-lg flex flex-col items-center justify-center transition-all disabled:hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                           >
                              {placingBetId === opt.id ? (
                                 <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                              ) : (
                                 <>
                                    <span className="text-sm font-semibold text-slate-300 group-hover:text-white truncate w-full text-center">{opt.text}</span>
                                    <span className="text-emerald-400 font-bold text-xs">{opt.odds}x</span>
                                 </>
                              )}
                              {/* Hover overlay for payout projection */}
                              {!isHost && bet.status === 'open' && (wagers[bet.id] || 0) > 0 && placingBetId === null && (
                                 <div className="absolute inset-0 bg-indigo-600/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold">Payout</span>
                                    <span className="text-sm font-black text-white">{Math.floor((wagers[bet.id] || 0) * opt.odds)} <Coins className="inline w-3 h-3 text-emerald-400 -mt-1"/></span>
                                 </div>
                              )}
                           </button>
                        ))}
                     </div>

                     {isHost && bet.status === 'open' && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
                           <button onClick={() => handleUpdateStatus(bet.id, 'closed')} className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-md">
                              Close Betting
                           </button>
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  )
}
