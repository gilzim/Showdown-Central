/**
 * @jest-environment node
 */
import { POST } from '@/app/api/wallet/refill/route'

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
describe('POST /api/wallet/refill', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('Auth error') })

    const response = await POST()
    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toBe('Unauthorized. Please log in.')
  })

  it('should return 400 when RPC reports balance is not 0', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Balance must be 0 to claim a refill' },
    })

    const response = await POST()
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Balance must be 0 to claim a refill.')
  })

  it('should return 429 when RPC reports cooldown is active', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Refill cooldown active. Please wait before claiming again.' },
    })

    const response = await POST()
    expect(response.status).toBe(429)
    const json = await response.json()
    expect(json.error).toContain('cooldown')
  })

  it('should return 500 on unexpected RPC error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Unexpected database error' },
    })

    const response = await POST()
    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.error).toBe('Failed to process refill.')
  })

  it('should return 200 with new balance on successful refill', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockRpc.mockResolvedValue({
      data: { new_balance: 500 },
      error: null,
    })

    const response = await POST()
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.newBalance).toBe(500)

    // Verify the correct RPC was called
    expect(mockRpc).toHaveBeenCalledWith('claim_refill')
  })
})
