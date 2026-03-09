'use client'

import { create } from 'zustand'

interface SapsState {
  balance: number
  lastRefill: number | null
  isLoading: boolean
  
  initializeBalance: (initialBalance: number, lastRefillDate?: string) => void
  deductSaps: (amount: number) => boolean
  addSaps: (amount: number) => void
  setBalance: (amount: number) => void
  claimRefill: () => void
}

export const useSapsStore = create<SapsState>((set, get) => ({
  balance: 0,
  lastRefill: null,
  isLoading: true,
  
  initializeBalance: (initialBalance, lastRefillDate) => set({ 
     balance: initialBalance, 
     lastRefill: lastRefillDate ? new Date(lastRefillDate).getTime() : null,
     isLoading: false 
  }),
  
  deductSaps: (amount) => {
     const state = get()
     if (state.balance >= amount) {
        set({ balance: state.balance - amount })
        return true
     }
     return false
  },
  
  addSaps: (amount) => set((state) => ({ balance: state.balance + amount })),
  
  setBalance: (amount) => set({ balance: amount }),
  
  claimRefill: () => set((state) => {
     const now = Date.now()
     const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
     
     if (state.balance === 0) {
        if (!state.lastRefill || (now - state.lastRefill) >= TWENTY_FOUR_HOURS) {
           return { balance: 500, lastRefill: now }
        }
     }
     return state
  })
}))
