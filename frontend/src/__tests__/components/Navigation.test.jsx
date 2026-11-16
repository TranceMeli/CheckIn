import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import UserMenu from '../../components/UserMenu'
import { useAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

const admin = { email: 'admin@checkin.de', role: 'Admin' }
const mitarbeiter = { email: 'l.mueller@checkin.de', role: 'Mitarbeiter' }

beforeEach(() => {
  useAuth.mockReset()
})

describe('Navbar', () => {
  const renderNav = (user, props = {}, route = '/dashboard') => {
    useAuth.mockReturnValue({ user })
    return render(<MemoryRouter initialEntries={[route]}><Navbar {...props} /></MemoryRouter>)
  }

  it('zeigt Admins Auswertungen, Verwalten und Export', () => {
    renderNav(admin)

    expect(screen.getAllByRole('link').map(l => l.textContent)).toEqual(['Auswertungen', 'Verwalten', 'Export'])
  })

  it('zeigt Mitarbeitern Check-in und Auswertungen', () => {
    renderNav(mitarbeiter)

    expect(screen.getAllByRole('link').map(l => l.textContent)).toEqual(['Check-in', 'Auswertungen'])
  })

  it('zeigt Mitarbeitern keine Admin-Seiten', () => {
    renderNav(mitarbeiter)

    expect(screen.queryByRole('link', { name: 'Verwalten' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Export' })).toBeNull()
  })

  it('zeigt ohne Anmeldung keine Links', () => {
    renderNav(null)

    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('verlinkt auf die richtigen Pfade', () => {
    renderNav(admin)

    expect(screen.getByRole('link', { name: 'Verwalten' })).toHaveAttribute('href', '/manage')
    expect(screen.getByRole('link', { name: 'Export' })).toHaveAttribute('href', '/list')
  })

  it('markiert die aktuelle Seite als aktiv', () => {
    renderNav(admin, {}, '/manage')

    expect(screen.getByRole('link', { name: 'Verwalten' })).toHaveClass('active')
    expect(screen.getByRole('link', { name: 'Auswertungen' })).not.toHaveClass('active')
  })

  it('rendert die Top-Leiste und die Tab-Leiste mit eigenen Klassen', () => {
    const { container, unmount } = renderNav(admin, { variant: 'top' })
    expect(container.querySelector('nav')).toHaveClass('nav-top')
    unmount()

    const tab = renderNav(admin, { variant: 'tab' })
    expect(tab.container.querySelector('nav')).toHaveClass('nav-tab')
  })
})

describe('UserMenu (Benutzer-Icon)', () => {
  it('erscheint nicht, wenn niemand angemeldet ist', () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() })

    const { container } = render(<UserMenu />)

    expect(container).toBeEmptyDOMElement()
  })

  it('zeigt bei angemeldeten Personen nur das Icon, das Menü ist zu', () => {
    useAuth.mockReturnValue({ user: admin, logout: vi.fn() })
    render(<UserMenu />)

    expect(screen.getByRole('button', { name: 'Benutzermenü' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('öffnet das Menü mit E-Mail und Rolle', async () => {
    useAuth.mockReturnValue({ user: admin, logout: vi.fn() })
    render(<UserMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('admin@checkin.de')).toBeInTheDocument()
    expect(screen.getByText('Administrator')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Benutzermenü' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('nennt Mitarbeiter bei ihrer Rolle', async () => {
    useAuth.mockReturnValue({ user: mitarbeiter, logout: vi.fn() })
    render(<UserMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))

    expect(screen.getByText('Mitarbeiter')).toBeInTheDocument()
  })

  it('meldet über "Abmelden" ab', async () => {
    const logout = vi.fn()
    useAuth.mockReturnValue({ user: admin, logout })
    render(<UserMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Abmelden/ }))

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('schließt mit Escape', async () => {
    useAuth.mockReturnValue({ user: admin, logout: vi.fn() })
    render(<UserMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('schließt bei einem Klick außerhalb', async () => {
    useAuth.mockReturnValue({ user: admin, logout: vi.fn() })
    render(<div><span>daneben</span><UserMenu /></div>)
    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))

    await userEvent.click(screen.getByText('daneben'))

    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('schließt beim zweiten Klick auf das Icon', async () => {
    useAuth.mockReturnValue({ user: admin, logout: vi.fn() })
    render(<UserMenu />)
    const icon = screen.getByRole('button', { name: 'Benutzermenü' })

    await userEvent.click(icon)
    await userEvent.click(icon)

    expect(screen.queryByRole('menu')).toBeNull()
  })
})
