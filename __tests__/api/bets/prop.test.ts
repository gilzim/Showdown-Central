/**
 * @jest-environment node
 */
import { POST } from '@/app/api/bets/prop/route'
import { createMocks } from 'node-mocks-http'

// --- Mock Setup ---
const mockGetUser = jest.fn()
const mockRpc = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  }))
}))

// --- Tests ---
describe('POST /api/bets/prop', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth error') })
    
    const { req } = createMocks({ method: 'POST', body: {} })
    // NextRequest mock (simplified wrapping for Next.js App Router handlers expecting web Request)
    const request = new Request('http://localhost/api/bets/prop', { method: 'POST', body: JSON.stringify({}) })
    
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should return 400 for invalid inputs', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    
    const request = new Request('http://localhost/api/bets/prop', { 
      method: 'POST', 
      body: JSON.stringify({
        // Missing bettorId, propBetId, etc.
        amount: -50 
      }) 
    })
    
    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid bet parameters')
  })

  it('should return 400 for insufficient SAPS balance', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Insufficient SAPS balance' } })
    
    const request = new Request('http://localhost/api/bets/prop', { 
      method: 'POST', 
      body: JSON.stringify({
        bettorId: 'user-1',
        propBetId: 'prop-1',
        optionId: 'opt-1',
        amount: 100,
        odds: 2.0
      }) 
    })
    
    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Insufficient SAPS balance')
  })

  it('should atomically place prop bet via RPC and return new balance', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockRpc.mockResolvedValue({ data: { bet_id: 'bet-888', new_balance: 400, payout: 200, amount: 100, odds_at_bet: 2.0, status: 'pending' }, error: null })
    
    const request = new Request('http://localhost/api/bets/prop', { 
      method: 'POST', 
      body: JSON.stringify({
        bettorId: 'user-1',
        propBetId: 'prop-1',
        optionId: 'opt-1',
        amount: 100,
        odds: 2.0
      }) 
    })
    
    const response = await POST(request)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.newBalance).toBe(400)
    expect(json.bet).toEqual(expect.objectContaining({
      id: 'bet-888',
      payout: 200,
      status: 'pending',
    }))

    // Verify RPC was called with correct parameters
    expect(mockRpc).toHaveBeenCalledWith('place_prop_bet', {
      p_prop_bet_id: 'prop-1',
      p_option_id: 'opt-1',
      p_amount: 100,
      p_odds: 2.0,
    })
  })
})

