/**
 * @jest-environment node
 */
import { GET } from '@/app/api/transactions/route'

const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockOrder = jest.fn()
const mockLimit = jest.fn()

const mockFrom = jest.fn(() => ({
  select: mockSelect.mockReturnValue({
    eq: mockEq.mockReturnValue({
      order: mockOrder.mockReturnValue({
        limit: mockLimit,
      }),
    }),
  }),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

describe('GET /api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth error') })

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('should return recent transactions for authenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockLimit.mockResolvedValue({
      data: [
        { id: 'tx-1', type: 'bet_place', amount: -100, description: 'Wager placed', created_at: '2026-01-01T00:00:00Z' },
        { id: 'tx-2', type: 'bonus', amount: 100, description: 'Daily login bonus', created_at: '2026-01-02T00:00:00Z' },
      ],
      error: null,
    })

    const response = await GET()
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.transactions).toHaveLength(2)
    expect(json.transactions[0].type).toBe('bet_place')
  })

  it('should return empty array when user has no transactions', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockLimit.mockResolvedValue({ data: [], error: null })

    const response = await GET()
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.transactions).toHaveLength(0)
  })
})
