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
  it('rendert nichts, solange die Sitzung noch wiederhergestellt wird', () => {
    const { container } = renderRoutes({ user: null, loading: true }, '/privat')

    expect(container).toBeEmptyDOMElement()
  })

  it('leitet nicht angemeldete Personen auf /login um', () => {
    renderRoutes({ user: null, loading: false }, '/privat')

    expect(screen.getByText('Login-Seite')).toBeInTheDocument()
    expect(screen.queryByText('Privater Inhalt')).toBeNull()
  })

  it('zeigt angemeldeten Personen den Inhalt', () => {
    renderRoutes({ user: { role: 'Mitarbeiter' }, loading: false }, '/privat')

    expect(screen.getByText('Privater Inhalt')).toBeInTheDocument()
  })

  it('lässt eine erlaubte Rolle durch', () => {
    renderRoutes({ user: { role: 'Admin' }, loading: false }, '/manage', ['Admin'])

    expect(screen.getByText('Geheime Verwaltung')).toBeInTheDocument()
  })

  it('schickt eine nicht erlaubte Rolle zum Dashboard', () => {
    renderRoutes({ user: { role: 'Mitarbeiter' }, loading: false }, '/manage', ['Admin'])

    expect(screen.getByText('Dashboard-Seite')).toBeInTheDocument()
    expect(screen.queryByText('Geheime Verwaltung')).toBeNull()
  })

  it('schickt nicht angemeldete Personen auch bei Rollenschutz auf /login', () => {
    renderRoutes({ user: null, loading: false }, '/manage', ['Admin'])

    expect(screen.getByText('Login-Seite')).toBeInTheDocument()
  })
})
