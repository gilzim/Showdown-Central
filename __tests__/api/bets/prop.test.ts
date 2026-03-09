/**
 * @jest-environment node
 */
import { POST } from '@/app/api/bets/prop/route'
import { createMocks } from 'node-mocks-http'

// --- Mock Setup ---
const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockEqSelect = jest.fn()
const mockSingleSelect = jest.fn()
const mockUpdate = jest.fn()
const mockEqUpdate = jest.fn()
const mockInsert = jest.fn()
const mockSelectInsert = jest.fn()
const mockSingleInsert = jest.fn()

const mockFrom = jest.fn((table: string) => {
  if (table === 'profiles') {
    return {
      select: mockSelect.mockReturnValue({ eq: mockEqSelect.mockReturnValue({ single: mockSingleSelect }) }),
      update: mockUpdate.mockReturnValue({ eq: mockEqUpdate }),
    }
  }
  if (table === 'user_prop_bets' || table === 'transactions') {
    return {
      insert: mockInsert.mockReturnValue({ select: mockSelectInsert.mockReturnValue({ single: mockSingleInsert }) }),
    }
  }
  return {}
})

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom
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
    mockSingleSelect.mockResolvedValue({ data: { saps_balance: 50 }, error: null }) // User has 50 SAPS
    
    const request = new Request('http://localhost/api/bets/prop', { 
      method: 'POST', 
      body: JSON.stringify({
        bettorId: 'user-1',
        propBetId: 'prop-1',
        optionId: 'opt-1',
        amount: 100, // Bets 100
        odds: 2.0
      }) 
    })
    
    const response = await POST(request)
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Insufficient SAPS balance')
  })

  it('should deduct balance and create bet successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSingleSelect.mockResolvedValue({ data: { saps_balance: 500 }, error: null }) // User has 500 SAPS
    mockEqUpdate.mockResolvedValue({ error: null }) // Balance update succeeds
    mockSingleInsert.mockResolvedValue({ data: { id: 'bet-888' }, error: null }) // Bet creation succeeds
    mockInsert.mockResolvedValue({ error: null }) // Transaction log succeeds (no chained select)
    
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
    expect(json.newBalance).toBe(400) // 500 - 100
    
    // Verify mock expectations
    expect(mockEqUpdate).toHaveBeenCalledWith('id', 'user-1')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      bettor_id: 'user-1',
      prop_bet_id: 'prop-1',
      option_id: 'opt-1',
      amount: 100,
      odds_at_bet: 2.0,
      payout: 200,
      status: 'pending'
    }))
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
       user_id: 'user-1',
       type: 'bet_place',
       amount: -100,
       reference_id: 'bet-888'
    }))
  })
})
