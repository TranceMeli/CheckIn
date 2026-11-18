import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'

const { api, setAccessToken } = vi.hoisted(() => ({
  api: { post: vi.fn() },
  setAccessToken: vi.fn(),
}))

vi.mock('../../api/api', () => ({ api, setAccessToken }))

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

// Unsignierter JWT: die App liest nur die Nutzdaten, die Signatur prüft der Server
const makeJwt = (payload) => {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.signatur`
}

const adminToken = makeJwt({ email: 'admin@checkin.de', username: 'admin@checkin.de', [ROLE_CLAIM]: 'Admin', exp: 9999999999 })
const mitarbeiterToken = makeJwt({ email: 'l.mueller@checkin.de', username: 'l.mueller', [ROLE_CLAIM]: 'Mitarbeiter', exp: 9999999999 })

function Anzeige() {
  const { user, loading, login, logout, isAdmin, isUser } = useAuth()
  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="email">{user?.email ?? 'niemand'}</p>
      <p data-testid="rolle">{user?.role ?? 'keine'}</p>
      <p data-testid="admin">{String(isAdmin())}</p>
      <p data-testid="mitarbeiter">{String(isUser())}</p>
      <button onClick={() => login(adminToken)}>Admin-Login</button>
      <button onClick={() => login(mitarbeiterToken)}>Mitarbeiter-Login</button>
      <button onClick={() => login('kaputt')}>Kaputter Login</button>
      <button onClick={() => logout()}>Abmelden</button>
    </div>
  )
}

const renderProvider = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route path="/dashboard" element={<Anzeige />} />
          <Route path="/login" element={<p>Login-Seite</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )

beforeEach(() => {
  api.post.mockReset()
  setAccessToken.mockReset()
})

describe('AuthProvider: restoring the session', () => {
  it('loads first and restores the session from the refresh cookie', async () => {
    api.post.mockResolvedValue({ data: { accessToken: adminToken } })
    renderProvider()

    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    expect(api.post).toHaveBeenCalledWith('/Auth/refresh', {}, { withCredentials: true })
    expect(setAccessToken).toHaveBeenCalledWith(adminToken)
    expect(screen.getByTestId('email')).toHaveTextContent('admin@checkin.de')
    expect(screen.getByTestId('rolle')).toHaveTextContent('Admin')
  })

  it('stays signed out without a valid cookie and does not redirect', async () => {
    api.post.mockRejectedValue({ response: { status: 401 } })
    renderProvider()

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    expect(screen.getByTestId('email')).toHaveTextContent('niemand')
    expect(screen.queryByText('Login-Seite')).toBeNull()
  })
})

describe('AuthProvider: roles', () => {
  beforeEach(() => {
    api.post.mockRejectedValue(new Error('kein Cookie'))
  })

  it('recognises admins', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await userEvent.click(screen.getByRole('button', { name: 'Admin-Login' }))

    expect(screen.getByTestId('admin')).toHaveTextContent('true')
    expect(screen.getByTestId('mitarbeiter')).toHaveTextContent('false')
  })

  it('recognises employees', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await userEvent.click(screen.getByRole('button', { name: 'Mitarbeiter-Login' }))

    expect(screen.getByTestId('mitarbeiter')).toHaveTextContent('true')
    expect(screen.getByTestId('admin')).toHaveTextContent('false')
  })

  it('is neither admin nor employee when signed out', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    expect(screen.getByTestId('admin')).toHaveTextContent('false')
    expect(screen.getByTestId('mitarbeiter')).toHaveTextContent('false')
  })
})

describe('AuthProvider: login and logout', () => {
  beforeEach(() => {
    api.post.mockImplementation(async (url) => {
      if (url === '/Auth/refresh') throw new Error('kein Cookie')
      return { data: {} }
    })
  })

  it('login keeps the token in memory only and sets the user', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await userEvent.click(screen.getByRole('button', { name: 'Mitarbeiter-Login' }))

    expect(setAccessToken).toHaveBeenCalledWith(mitarbeiterToken)
    expect(screen.getByTestId('email')).toHaveTextContent('l.mueller@checkin.de')
  })

  it('ignores an unreadable token without crashing', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await userEvent.click(screen.getByRole('button', { name: 'Kaputter Login' }))

    expect(screen.getByTestId('email')).toHaveTextContent('niemand')
  })

  it('logout revokes the cookie, clears the token and goes to the login page', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await userEvent.click(screen.getByRole('button', { name: 'Admin-Login' }))

    await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }))

    expect(api.post).toHaveBeenCalledWith('/Auth/logout')
    expect(setAccessToken).toHaveBeenLastCalledWith(null)
    expect(await screen.findByText('Login-Seite')).toBeInTheDocument()
  })

  it('also signs out when the server is unreachable during logout', async () => {
    api.post.mockImplementation(async (url) => {
      if (url === '/Auth/logout') throw new Error('offline')
      throw new Error('kein Cookie')
    })
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await userEvent.click(screen.getByRole('button', { name: 'Admin-Login' }))

    await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }))

    expect(await screen.findByText('Login-Seite')).toBeInTheDocument()
    expect(setAccessToken).toHaveBeenLastCalledWith(null)
  })

  it('logs out on "auth:logout" (refresh failed) without another API call', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await userEvent.click(screen.getByRole('button', { name: 'Admin-Login' }))
    api.post.mockClear()

    act(() => { window.dispatchEvent(new Event('auth:logout')) })

    expect(await screen.findByText('Login-Seite')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })
})
