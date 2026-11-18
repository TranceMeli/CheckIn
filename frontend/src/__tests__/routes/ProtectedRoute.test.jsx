import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../../routes/ProtectedRoute'
import { useAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

beforeEach(() => {
  useAuth.mockReset()
})

const renderRoutes = (auth, route, allowedRoles) => {
  useAuth.mockReturnValue(auth)
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/login" element={<p>Login-Seite</p>} />
        <Route path="/dashboard" element={<p>Dashboard-Seite</p>} />
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/manage" element={<p>Geheime Verwaltung</p>} />
          <Route path="/privat" element={<p>Privater Inhalt</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('renders nothing while the session is still being restored', () => {
    const { container } = renderRoutes({ user: null, loading: true }, '/privat')

    expect(container).toBeEmptyDOMElement()
  })

  it('redirects people who are not signed in to /login', () => {
    renderRoutes({ user: null, loading: false }, '/privat')

    expect(screen.getByText('Login-Seite')).toBeInTheDocument()
    expect(screen.queryByText('Privater Inhalt')).toBeNull()
  })

  it('shows the content to signed-in people', () => {
    renderRoutes({ user: { role: 'Mitarbeiter' }, loading: false }, '/privat')

    expect(screen.getByText('Privater Inhalt')).toBeInTheDocument()
  })

  it('lets an allowed role through', () => {
    renderRoutes({ user: { role: 'Admin' }, loading: false }, '/manage', ['Admin'])

    expect(screen.getByText('Geheime Verwaltung')).toBeInTheDocument()
  })

  it('sends a role that is not allowed to the dashboard', () => {
    renderRoutes({ user: { role: 'Mitarbeiter' }, loading: false }, '/manage', ['Admin'])

    expect(screen.getByText('Dashboard-Seite')).toBeInTheDocument()
    expect(screen.queryByText('Geheime Verwaltung')).toBeNull()
  })

  it('sends people who are not signed in to /login even with role protection', () => {
    renderRoutes({ user: null, loading: false }, '/manage', ['Admin'])

    expect(screen.getByText('Login-Seite')).toBeInTheDocument()
  })
})
