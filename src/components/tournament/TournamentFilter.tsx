'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import TournamentCard, { TournamentCardProps } from '@/components/tournament/TournamentCard'

interface TournamentFilterProps {
  tournaments: TournamentCardProps[]
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'active', label: 'Live' },
  { value: 'completed', label: 'Completed' },
]

export default function TournamentFilter({ tournaments }: TournamentFilterProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.game?.toLowerCase() ?? '').includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tournaments, search, statusFilter])

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or game…"
            className="w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="text-zinc-500 col-span-full">No tournaments match your search.</p>
        ) : (
          filtered.map((t) => <TournamentCard key={t.id} {...t} />)
        )}
      </div>
    </div>
  )
}
