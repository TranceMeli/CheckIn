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

describe('AuthProvider: Sitzung wiederherstellen', () => {
  it('lädt zuerst und stellt die Sitzung aus dem Refresh-Cookie wieder her', async () => {
    api.post.mockResolvedValue({ data: { accessToken: adminToken } })
    renderProvider()

    expect(screen.getByTestId('loading')).toHaveTextContent('true')
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    expect(api.post).toHaveBeenCalledWith('/Auth/refresh', {}, { withCredentials: true })
    expect(setAccessToken).toHaveBeenCalledWith(adminToken)
    expect(screen.getByTestId('email')).toHaveTextContent('admin@checkin.de')
    expect(screen.getByTestId('rolle')).toHaveTextContent('Admin')
  })

  it('bleibt ohne gültiges Cookie ausgeloggt und leitet nicht um', async () => {
    api.post.mockRejectedValue({ response: { status: 401 } })
    renderProvider()

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    expect(screen.getByTestId('email')).toHaveTextContent('niemand')
    expect(screen.queryByText('Login-Seite')).toBeNull()
  })
})

describe('AuthProvider: Rollen', () => {
  beforeEach(() => {
    api.post.mockRejectedValue(new Error('kein Cookie'))
  })

  it('erkennt Admins', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await userEvent.click(screen.getByRole('button', { name: 'Admin-Login' }))

    expect(screen.getByTestId('admin')).toHaveTextContent('true')
    expect(screen.getByTestId('mitarbeiter')).toHaveTextContent('false')
  })

  it('erkennt Mitarbeiter', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await userEvent.click(screen.getByRole('button', { name: 'Mitarbeiter-Login' }))

    expect(screen.getByTestId('mitarbeiter')).toHaveTextContent('true')
    expect(screen.getByTestId('admin')).toHaveTextContent('false')
  })

  it('ist ohne Anmeldung weder Admin noch Mitarbeiter', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    expect(screen.getByTestId('admin')).toHaveTextContent('false')
    expect(screen.getByTestId('mitarbeiter')).toHaveTextContent('false')
  })
})

describe('AuthProvider: login und logout', () => {
  beforeEach(() => {
    api.post.mockImplementation(async (url) => {
      if (url === '/Auth/refresh') throw new Error('kein Cookie')
      return { data: {} }
    })
  })

  it('login merkt sich den Token nur im Speicher und setzt den Benutzer', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await userEvent.click(screen.getByRole('button', { name: 'Mitarbeiter-Login' }))

    expect(setAccessToken).toHaveBeenCalledWith(mitarbeiterToken)
    expect(screen.getByTestId('email')).toHaveTextContent('l.mueller@checkin.de')
  })

  it('ignoriert einen unlesbaren Token, ohne abzustürzen', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    await userEvent.click(screen.getByRole('button', { name: 'Kaputter Login' }))

    expect(screen.getByTestId('email')).toHaveTextContent('niemand')
  })

  it('logout widerruft das Cookie, löscht den Token und geht zur Login-Seite', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await userEvent.click(screen.getByRole('button', { name: 'Admin-Login' }))

    await userEvent.click(screen.getByRole('button', { name: 'Abmelden' }))

    expect(api.post).toHaveBeenCalledWith('/Auth/logout')
    expect(setAccessToken).toHaveBeenLastCalledWith(null)
    expect(await screen.findByText('Login-Seite')).toBeInTheDocument()
  })

  it('meldet auch ab, wenn der Server beim Logout nicht erreichbar ist', async () => {
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

  it('führt bei "auth:logout" (Refresh gescheitert) einen Logout ohne weiteren API-Aufruf aus', async () => {
    renderProvider()
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await userEvent.click(screen.getByRole('button', { name: 'Admin-Login' }))
    api.post.mockClear()

    act(() => { window.dispatchEvent(new Event('auth:logout')) })

    expect(await screen.findByText('Login-Seite')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })
})
