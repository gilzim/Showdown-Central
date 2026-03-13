'use client'

import { create } from 'zustand'

interface SapsState {
  balance: number
  isLoading: boolean
  
  initializeBalance: (initialBalance: number) => void
  deductSaps: (amount: number) => boolean
  addSaps: (amount: number) => void
  setBalance: (amount: number) => void
}

export const useSapsStore = create<SapsState>((set, get) => ({
  balance: 0,
  isLoading: true,
  
  initializeBalance: (initialBalance) => set({ 
     balance: initialBalance, 
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
}))
