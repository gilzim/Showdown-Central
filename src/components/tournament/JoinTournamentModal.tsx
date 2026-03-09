'use client'

import { useState } from 'react'
import { Key, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function JoinTournamentModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (!isOpen) return null

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/tournaments/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ joinCode: code.toUpperCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join tournament')
      }

      onClose()
      router.push(`/tournaments/${data.tournamentId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Join Tournament</h2>
          <p className="text-slate-400 text-sm mb-6">Enter the 6-character code provided by the tournament host to enter the bracket.</p>

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div>
              <input
                type="text"
                placeholder="e.g. A1B2C3"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full bg-slate-800 border-2 border-slate-700 focus:border-blue-500 rounded-xl px-4 py-4 text-center font-mono text-2xl font-bold text-white tracking-widest outline-none transition-all placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-base"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Bracket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
