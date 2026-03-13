import { create } from 'zustand'

export type Team = {
  id: string
  name: string
  p1: string
  p2: string
}

export type MatchupNode = {
  id: string
  roundIndex: number
  matchIndex: number
  team1Id: string | null
  team2Id: string | null
  team1Score: string
  team2Score: string
  winnerId: string | null
  odds_a?: number
  odds_b?: number
}

interface TournamentState {
  teamsCount: number
  teams: Team[]
  matchups: MatchupNode[]
  
  // Actions
  setTeamsCount: (count: number) => void
  updateTeam: (id: string, updates: Partial<Team>) => void
  updateMatchupScore: (matchupId: string, teamNum: 1 | 2, score: string) => void
  advanceWinner: (matchupId: string, winnerId: string) => void
  randomizeTeams: () => void
  resetBracket: () => void
  setInitialData: (data: { teamsCount: number; teams: Team[]; matchups: MatchupNode[] }) => void
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  teamsCount: 8,
  teams: [],
  matchups: [],

  setInitialData: (data) => set(data),

  setTeamsCount: (count) => {
    // Basic init logic - will be expanded to match the HTML version exactly
    const newTeams = Array.from({ length: count }, (_, i) => ({
      id: `team-${i}`,
      name: `Team ${String.fromCharCode(65 + i)}`,
      p1: '',
      p2: '',
    }))

    // Calculate total matchups for a perfect single-elimination bracket
    // e.g., 8 teams = 4 + 2 + 1 = 7 matchups
    const totalRounds = Math.log2(count)
    const newMatchups: MatchupNode[] = []
    
    let matchIdCounter = 1
    for (let r = 0; r < totalRounds; r++) {
      const matchesInRound = count / Math.pow(2, r + 1)
      for (let m = 0; m < matchesInRound; m++) {
        newMatchups.push({
          id: `match-${matchIdCounter++}`,
          roundIndex: r,
          matchIndex: m,
          team1Id: r === 0 ? newTeams[m * 2].id : null,
          team2Id: r === 0 ? newTeams[m * 2 + 1].id : null,
          team1Score: '',
          team2Score: '',
          winnerId: null
        })
      }
    }

    set({ teamsCount: count, teams: newTeams, matchups: newMatchups })
  },

  updateTeam: (id, updates) => set((state) => ({
    teams: state.teams.map((t) => (t.id === id ? { ...t, ...updates } : t))
  })),

  updateMatchupScore: (matchupId, teamNum, score) => set((state) => {
     return {
       matchups: state.matchups.map(m => {
         if (m.id === matchupId) {
            return teamNum === 1 ? { ...m, team1Score: score } : { ...m, team2Score: score }
         }
         return m
       })
     }
  }),

  advanceWinner: (matchupId, winnerId) => set((state) => {
     const currentMatchup = state.matchups.find(m => m.id === matchupId)
     if (!currentMatchup) return state

     const nextRoundIndex = currentMatchup.roundIndex + 1
     const nextMatchIndex = Math.floor(currentMatchup.matchIndex / 2)
     const isTeam1 = currentMatchup.matchIndex % 2 === 0

     const newMatchups = state.matchups.map(m => {
        // Update winner of current
        if (m.id === matchupId) {
           return { ...m, winnerId }
        }
        // Advance to next round
        if (m.roundIndex === nextRoundIndex && m.matchIndex === nextMatchIndex) {
           return isTeam1 ? { ...m, team1Id: winnerId } : { ...m, team2Id: winnerId }
        }
        return m
     })

     return { matchups: newMatchups }
  }),

  randomizeTeams: () => set((state) => {
    const shuffledParams = [...state.teams]
    for (let i = shuffledParams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledParams[i], shuffledParams[j]] = [shuffledParams[j], shuffledParams[i]];
    }
    
    // Reassign teams to Round 1 matchups
    const newMatchups = state.matchups.map(m => {
       if (m.roundIndex === 0) {
          return {
             ...m,
             team1Id: shuffledParams[m.matchIndex * 2].id,
             team2Id: shuffledParams[m.matchIndex * 2 + 1].id,
             team1Score: '',
             team2Score: '',
             winnerId: null
          }
       }
       // reset later rounds
       return { ...m, team1Id: null, team2Id: null, team1Score: '', team2Score: '', winnerId: null }
    })
    
    return { teams: shuffledParams, matchups: newMatchups }
  }),

  resetBracket: () => set((state) => {
     const newMatchups = state.matchups.map(m => {
        if (m.roundIndex === 0) {
           return { ...m, team1Score: '', team2Score: '', winnerId: null }
        }
        return { ...m, team1Id: null, team2Id: null, team1Score: '', team2Score: '', winnerId: null }
     })
     return { matchups: newMatchups }
  })
}))
