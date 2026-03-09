'use client'

import { useState } from 'react'
import JoinTournamentModal from '@/components/tournament/JoinTournamentModal'

export default function DashboardJoinButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="mt-auto py-3 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors border border-slate-600"
      >
        Join with Code
      </button>

      <JoinTournamentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
