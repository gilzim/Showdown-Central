/**
 * @jest-environment node
 */
import { PATCH } from '@/app/api/tournaments/[id]/status/route'

// --- Mock Setup ---
const mockGetUser = jest.fn()
const mockFrom = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockUpdate = jest.fn()
const mockUpdateEq = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

function buildSelectChain(result: unknown) {
  mockSingle.mockResolvedValue(result)
  mockEq.mockReturnValue({ single: mockSingle })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate })
}

function buildUpdateChain(result: unknown) {
  mockUpdateEq.mockResolvedValue(result)
  mockUpdate.mockReturnValue({ eq: mockUpdateEq })
}

// --- Tests ---
describe('PATCH /api/tournaments/[id]/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('auth') })

    const request = new Request('http://localhost/api/tournaments/t1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 't1' }) })
    expect(response.status).toBe(401)
  })

  it('returns 404 if tournament is not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    buildSelectChain({ data: null, error: new Error('not found') })

    const request = new Request('http://localhost/api/tournaments/t1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 't1' }) })
    expect(response.status).toBe(404)
  })

  it('returns 403 if user is not the host', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    buildSelectChain({ data: { host_id: 'other-user', status: 'draft' }, error: null })

    const request = new Request('http://localhost/api/tournaments/t1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 't1' }) })
    expect(response.status).toBe(403)
  })

  it('returns 400 for an invalid status value', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    buildSelectChain({ data: { host_id: 'user-1', status: 'draft' }, error: null })

    const request = new Request('http://localhost/api/tournaments/t1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'invalid-status' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 't1' }) })
    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toMatch(/Invalid status/)
  })

  it('returns 200 and updates status when valid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    buildSelectChain({ data: { host_id: 'user-1', status: 'draft' }, error: null })
    buildUpdateChain({ error: null })

    const request = new Request('http://localhost/api/tournaments/t1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 't1' }) })
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.status).toBe('active')
  })
})
