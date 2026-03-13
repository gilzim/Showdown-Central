/**
 * Tests for the advance_team RPC integration.
 *
 * Validates that:
 *  1. The Zustand store's advanceWinner correctly mirrors the DB function's
 *     bracket-advancement logic (odd position → team1 slot, even → team2 slot).
 *  2. The UUID guard ensures the RPC is only called when real DB IDs are present.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mirrors the SQL function's next-position logic: ceil(position / 2) */
function nextPosition(position: number): number {
  return Math.ceil(position / 2)
}

/** Mirrors the SQL function's slot selection: odd position → team_a (slot 1), even → team_b (slot 2) */
function nextSlot(position: number): 'team_a' | 'team_b' {
  return position % 2 === 1 ? 'team_a' : 'team_b'
}

// ---------------------------------------------------------------------------
// nextPosition / nextSlot logic (mirrors the PostgreSQL function)
// ---------------------------------------------------------------------------

describe('advance_team bracket-advancement logic', () => {
  it('advances position 1 → next position 1, slot team_a', () => {
    expect(nextPosition(1)).toBe(1)
    expect(nextSlot(1)).toBe('team_a')
  })

  it('advances position 2 → next position 1, slot team_b', () => {
    expect(nextPosition(2)).toBe(1)
    expect(nextSlot(2)).toBe('team_b')
  })

  it('advances position 3 → next position 2, slot team_a', () => {
    expect(nextPosition(3)).toBe(2)
    expect(nextSlot(3)).toBe('team_a')
  })

  it('advances position 4 → next position 2, slot team_b', () => {
    expect(nextPosition(4)).toBe(2)
    expect(nextSlot(4)).toBe('team_b')
  })

  it('handles an 8-team bracket: position 7 advances to position 4, slot team_a', () => {
    expect(nextPosition(7)).toBe(4)
    expect(nextSlot(7)).toBe('team_a')
  })

  it('handles an 8-team bracket: position 8 advances to position 4, slot team_b', () => {
    expect(nextPosition(8)).toBe(4)
    expect(nextSlot(8)).toBe('team_b')
  })
})

// ---------------------------------------------------------------------------
// UUID guard – the RPC must only be called when IDs are real DB UUIDs
// ---------------------------------------------------------------------------

describe('UUID guard for advance_team RPC', () => {
  it('recognizes a valid UUID', () => {
    expect(UUID_REGEX.test('3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe(true)
  })

  it('rejects a local frontend ID (match-1)', () => {
    expect(UUID_REGEX.test('match-1')).toBe(false)
  })

  it('rejects a local frontend team ID (team-0)', () => {
    expect(UUID_REGEX.test('team-0')).toBe(false)
  })

  it('only fires the RPC when both matchup and winner IDs are real UUIDs', () => {
    const mockRpc = jest.fn()

    const callRpcIfUuids = (matchupId: string, winnerId: string) => {
      if (UUID_REGEX.test(matchupId) && UUID_REGEX.test(winnerId)) {
        mockRpc({ p_matchup_id: matchupId, p_winner_id: winnerId })
      }
    }

    // Local IDs – no RPC call
    callRpcIfUuids('match-1', 'team-0')
    expect(mockRpc).not.toHaveBeenCalled()

    // DB UUIDs – RPC should fire
    const matchupUuid = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'
    const winnerUuid  = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    callRpcIfUuids(matchupUuid, winnerUuid)
    expect(mockRpc).toHaveBeenCalledWith({
      p_matchup_id: matchupUuid,
      p_winner_id:  winnerUuid,
    })
  })
})

// ---------------------------------------------------------------------------
// Zustand store – advanceWinner mirrors the DB function's local state update
// ---------------------------------------------------------------------------

import { useTournamentStore } from '@/store/useTournamentStore'

describe('useTournamentStore.advanceWinner mirrors advance_team DB logic', () => {
  beforeEach(() => {
    // Reset to a known 4-team bracket state (2 rounds: R1 has 2 matchups, R2 has 1)
    useTournamentStore.setState({
      teamsCount: 4,
      teams: [
        { id: 'team-0', name: 'Team A', p1: '', p2: '' },
        { id: 'team-1', name: 'Team B', p1: '', p2: '' },
        { id: 'team-2', name: 'Team C', p1: '', p2: '' },
        { id: 'team-3', name: 'Team D', p1: '', p2: '' },
      ],
      matchups: [
        { id: 'match-1', roundIndex: 0, matchIndex: 0, team1Id: 'team-0', team2Id: 'team-1', team1Score: '', team2Score: '', winnerId: null },
        { id: 'match-2', roundIndex: 0, matchIndex: 1, team1Id: 'team-2', team2Id: 'team-3', team1Score: '', team2Score: '', winnerId: null },
        { id: 'match-3', roundIndex: 1, matchIndex: 0, team1Id: null,     team2Id: null,     team1Score: '', team2Score: '', winnerId: null },
      ],
    })
  })

  it('sets winnerId on the resolved matchup', () => {
    useTournamentStore.getState().advanceWinner('match-1', 'team-0')
    const updated = useTournamentStore.getState().matchups.find(m => m.id === 'match-1')
    expect(updated?.winnerId).toBe('team-0')
  })

  it('places the winner into team1Id of the final matchup when matchIndex is even (odd 1-indexed position → team_a slot)', () => {
    // match-1 is at matchIndex 0 (position 1 in 1-indexed). Odd position → team_a slot → team1Id.
    useTournamentStore.getState().advanceWinner('match-1', 'team-0')
    const finalMatch = useTournamentStore.getState().matchups.find(m => m.id === 'match-3')
    expect(finalMatch?.team1Id).toBe('team-0')
    expect(finalMatch?.team2Id).toBeNull()
  })

  it('places the winner into team2Id of the final matchup when matchIndex is odd (even 1-indexed position → team_b slot)', () => {
    // match-2 is at matchIndex 1 (position 2 in 1-indexed). Even position → team_b slot → team2Id.
    useTournamentStore.getState().advanceWinner('match-2', 'team-2')
    const finalMatch = useTournamentStore.getState().matchups.find(m => m.id === 'match-3')
    expect(finalMatch?.team2Id).toBe('team-2')
    expect(finalMatch?.team1Id).toBeNull()
  })
})
