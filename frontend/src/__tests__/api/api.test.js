import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios, { AxiosError } from 'axios'
import { api, setAccessToken, getAccessToken } from '../../api/api'

// Der Axios-Adapter ersetzt das echte Netzwerk: jede Antwort kommt aus der Warteschlange.
const respond = (status, data = {}) => async (config) => {
  const response = { data, status, statusText: '', headers: {}, config }
  if (status >= 400) throw new AxiosError(`Status ${status}`, 'ERR_BAD_REQUEST', config, null, response)
  return response
}

let originalAdapter

beforeEach(() => {
  originalAdapter = api.defaults.adapter
  setAccessToken(null)
})

afterEach(() => {
  api.defaults.adapter = originalAdapter
  setAccessToken(null)
})

describe('Access token', () => {
  it('lives only in memory and can be set and cleared', () => {
    expect(getAccessToken()).toBeNull()

    setAccessToken('abc')
    expect(getAccessToken()).toBe('abc')

    setAccessToken(null)
    expect(getAccessToken()).toBeNull()
  })

  it('is never written to localStorage or sessionStorage', () => {
    setAccessToken('geheim')

    expect(JSON.stringify({ ...localStorage })).not.toContain('geheim')
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('geheim')
  })
})

describe('Request interceptor', () => {
  it('attaches the token as a bearer header', async () => {
    const adapter = vi.fn(respond(200))
    api.defaults.adapter = adapter
    setAccessToken('token-1')

    await api.get('/User/mitarbeiter')

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer token-1')
  })

  it('sends no Authorization header without a token', async () => {
    const adapter = vi.fn(respond(200))
    api.defaults.adapter = adapter

    await api.get('/Auth/refresh-test')

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined()
  })

  it('sends cookies (for the refresh token)', () => {
    expect(api.defaults.withCredentials).toBe(true)
  })
})

describe('Response interceptor on 401', () => {
  it('fetches a new token and retries the request', async () => {
    const adapter = vi.fn()
      .mockImplementationOnce(respond(401))
      .mockImplementationOnce(respond(200, { ok: true }))
    api.defaults.adapter = adapter
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'neuer-token' } })
    setAccessToken('abgelaufen')

    const response = await api.get('/CheckIn/checkin')

    expect(response.data).toEqual({ ok: true })
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0][0]).toContain('/Auth/refresh')
    expect(getAccessToken()).toBe('neuer-token')
    expect(adapter.mock.calls[1][0].headers.Authorization).toBe('Bearer neuer-token')
  })

  it('retries a request only once', async () => {
    const adapter = vi.fn(respond(401))
    api.defaults.adapter = adapter
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'neuer-token' } })

    await expect(api.get('/CheckIn/checkin')).rejects.toBeTruthy()

    expect(adapter).toHaveBeenCalledTimes(2) // Original + ein Wiederholungsversuch
  })

  it('forces a logout when the refresh fails', async () => {
    api.defaults.adapter = respond(401)
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Refresh abgelehnt'))
    const onLogout = vi.fn()
    window.addEventListener('auth:logout', onLogout)
    setAccessToken('abgelaufen')

    await expect(api.get('/CheckIn/checkin')).rejects.toThrow('Refresh abgelehnt')

    window.removeEventListener('auth:logout', onLogout)
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
  })

  // Regression: Beim App-Start ohne Cookie scheitert der Refresh mit 401. Das darf weder
  // einen Logout noch die Weiterleitung auf /login auslösen, sonst sind Impressum und Datenschutz nicht erreichbar.
  it('does not treat a 401 from the refresh call itself as an expired session', async () => {
    api.defaults.adapter = respond(401)
    const post = vi.spyOn(axios, 'post')
    const onLogout = vi.fn()
    window.addEventListener('auth:logout', onLogout)

    await expect(api.post('/Auth/refresh', {})).rejects.toBeTruthy()

    window.removeEventListener('auth:logout', onLogout)
    expect(post).not.toHaveBeenCalled()
    expect(onLogout).not.toHaveBeenCalled()
  })

  it('passes other errors (e.g. 403) through unchanged', async () => {
    api.defaults.adapter = respond(403)
    const post = vi.spyOn(axios, 'post')

    await expect(api.get('/Dashboard/overview')).rejects.toMatchObject({ response: { status: 403 } })

    expect(post).not.toHaveBeenCalled()
  })

  it('passes 409 conflicts through with the response', async () => {
    api.defaults.adapter = respond(409, { bestehenderStatus: 'Office' })

    await expect(api.post('/User/1/checkin', {})).rejects.toMatchObject({
      response: { status: 409, data: { bestehenderStatus: 'Office' } },
    })
  })
})
