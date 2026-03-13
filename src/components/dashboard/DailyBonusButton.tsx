'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Loader2, Check } from 'lucide-react'

interface DailyBonusButtonProps {
  lastBonusAt: string | null
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export default function DailyBonusButton({ lastBonusAt }: DailyBonusButtonProps) {
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isCooldown = lastBonusAt
    ? Date.now() - new Date(lastBonusAt).getTime() < TWENTY_FOUR_HOURS_MS
    : false

  const isAvailable = !isCooldown && !claimed

  const handleClaim = async () => {
    setError(null)
    setIsClaiming(true)
    try {
      const res = await fetch('/api/daily-bonus', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to claim bonus.')
      } else {
        setClaimed(true)
        router.refresh()
      }
    } catch {
      setError('Network error.')
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClaim}
        disabled={!isAvailable || isClaiming}
        title={isCooldown ? 'Already claimed today' : 'Claim your daily 100 SAPS bonus'}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-all border ${
          claimed
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default'
            : isAvailable
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
        }`}
      >
        {isClaiming ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : claimed ? (
          <Check className="w-4 h-4" />
        ) : (
          <Gift className="w-4 h-4" />
        )}
        {claimed ? 'Claimed!' : isCooldown ? 'Claimed Today' : 'Daily Bonus'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
