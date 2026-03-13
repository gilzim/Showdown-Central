/**
 * @jest-environment node
 */
import { POST } from '@/app/api/bets/place/route'

// --- Mock Setup ---
const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockEqSelect = jest.fn()
const mockSingleSelect = jest.fn()
const mockUpdate = jest.fn()
const mockEqUpdate = jest.fn()
const mockBetInsert = jest.fn()
const mockBetSelectInsert = jest.fn()
const mockBetSingleInsert = jest.fn()
const mockTxInsert = jest.fn()

const mockFrom = jest.fn((table: string) => {
  if (table === 'profiles') {
    return {
      select: mockSelect.mockReturnValue({ eq: mockEqSelect.mockReturnValue({ single: mockSingleSelect }) }),
      update: mockUpdate.mockReturnValue({ eq: mockEqUpdate }),
    }
  }
  if (table === 'bets') {
    return {
      insert: mockBetInsert.mockReturnValue({
        select: mockBetSelectInsert.mockReturnValue({ single: mockBetSingleInsert }),
      }),
    }
  }
  if (table === 'transactions') {
    return {
      insert: mockTxInsert,
    }
  }
  return {}
})

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

// --- Tests ---
describe('POST /api/bets/place', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth error') })

    const request = new Request('http://localhost/api/bets/place', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should return 400 for invalid inputs', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const request = new Request('http://localhost/api/bets/place', {
      method: 'POST',
      body: JSON.stringify({ matchup_id: 'match-1' }), // missing team_id, amount, odds_at_bet
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid bet parameters.')
  })

  it('should return 400 for insufficient SAPS balance', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSingleSelect.mockResolvedValue({ data: { saps_balance: 50 }, error: null })

    const request = new Request('http://localhost/api/bets/place', {
      method: 'POST',
      body: JSON.stringify({
        matchup_id: 'match-1',
        team_id: 'team-1',
        amount: 100,
        odds_at_bet: 1.8,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Insufficient SAPS balance.')
  })

  it('should deduct balance and create bet successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSingleSelect.mockResolvedValue({ data: { saps_balance: 500 }, error: null })
    mockEqUpdate.mockResolvedValue({ error: null })
    mockBetSingleInsert.mockResolvedValue({ data: { id: 'bet-123' }, error: null })
    mockTxInsert.mockResolvedValue({ error: null })

    const request = new Request('http://localhost/api/bets/place', {
      method: 'POST',
      body: JSON.stringify({
        matchup_id: 'match-1',
        team_id: 'team-1',
        amount: 100,
        odds_at_bet: 1.8,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.newBalance).toBe(400) // 500 - 100

    // Verify balance was deducted
    expect(mockEqUpdate).toHaveBeenCalledWith('id', 'user-1')

    // Verify bet was recorded
    expect(mockBetInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        bettor_id: 'user-1',
        matchup_id: 'match-1',
        team_id: 'team-1',
        amount: 100,
        odds_at_bet: 1.8,
        status: 'pending',
      })
    )

    // Verify transaction ledger entry
    expect(mockTxInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        type: 'bet_place',
        amount: -100,
        reference_id: 'bet-123',
      })
    )
  })
})
