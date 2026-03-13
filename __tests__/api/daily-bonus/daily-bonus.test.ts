/**
 * @jest-environment node
 */
import { POST } from '@/app/api/daily-bonus/route'

const mockGetUser = jest.fn()
const mockSelectSingle = jest.fn()
const mockUpdateEq = jest.fn()
const mockInsert = jest.fn()

const mockFrom = jest.fn((table: string) => {
  if (table === 'profiles') {
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ single: mockSelectSingle }),
      }),
      update: jest.fn().mockReturnValue({ eq: mockUpdateEq }),
    }
  }
  if (table === 'transactions') {
    return { insert: mockInsert }
  }
  return {}
})

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

const TWENTY_FOUR_HOURS_AGO = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
const ONE_HOUR_AGO = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()

describe('POST /api/daily-bonus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth error') })

    const response = await POST()
    expect(response.status).toBe(401)
  })

  it('should return 429 when bonus was already claimed within 24 hours', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSelectSingle.mockResolvedValue({
      data: { saps_balance: 600, last_bonus_at: ONE_HOUR_AGO },
      error: null,
    })

    const response = await POST()
    expect(response.status).toBe(429)
    const json = await response.json()
    expect(json.error).toBe('Daily bonus already claimed.')
  })

  it('should grant bonus when 24 hours have elapsed', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSelectSingle.mockResolvedValue({
      data: { saps_balance: 500, last_bonus_at: TWENTY_FOUR_HOURS_AGO },
      error: null,
    })
    mockUpdateEq.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ error: null })

    const response = await POST()
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.newBalance).toBe(600) // 500 + 100
    expect(json.amount).toBe(100)
  })

  it('should grant bonus when no previous bonus has been claimed', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockSelectSingle.mockResolvedValue({
      data: { saps_balance: 500, last_bonus_at: null },
      error: null,
    })
    mockUpdateEq.mockResolvedValue({ error: null })
    mockInsert.mockResolvedValue({ error: null })

    const response = await POST()
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.newBalance).toBe(600)
  })
})
