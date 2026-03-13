/**
 * @jest-environment node
 */
import { POST } from '@/app/api/bets/place/route'

// --- Mock Setup ---
const mockGetUser = jest.fn()
const mockRpc = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
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
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Insufficient SAPS balance' } })

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

  it('should atomically place bet via RPC and return new balance', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockRpc.mockResolvedValue({ data: { bet_id: 'bet-123', new_balance: 400 }, error: null })

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
    expect(json.newBalance).toBe(400)

    // Verify RPC was called with correct parameters
    expect(mockRpc).toHaveBeenCalledWith('place_bet', {
      p_matchup_id: 'match-1',
      p_team_id: 'team-1',
      p_amount: 100,
      p_odds: 1.8,
    })
  })
})

