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

  it('shows admins Dashboard, Manage and Export', () => {
    renderNav(admin)

    expect(screen.getAllByRole('link').map(l => l.textContent)).toEqual(['Auswertungen', 'Verwalten', 'Export'])
  })

  it('shows employees Check-in and Dashboard', () => {
    renderNav(mitarbeiter)

    expect(screen.getAllByRole('link').map(l => l.textContent)).toEqual(['Check-in', 'Auswertungen'])
  })

  it('shows employees no admin pages', () => {
    renderNav(mitarbeiter)

    expect(screen.queryByRole('link', { name: 'Verwalten' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Export' })).toBeNull()
  })

  it('shows no links when signed out', () => {
    renderNav(null)

    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('links to the right paths', () => {
    renderNav(admin)

    expect(screen.getByRole('link', { name: 'Verwalten' })).toHaveAttribute('href', '/manage')
    expect(screen.getByRole('link', { name: 'Export' })).toHaveAttribute('href', '/list')
  })

  it('marks the current page as active', () => {
    renderNav(admin, {}, '/manage')

    expect(screen.getByRole('link', { name: 'Verwalten' })).toHaveClass('active')
    expect(screen.getByRole('link', { name: 'Auswertungen' })).not.toHaveClass('active')
  })

  it('renders the top bar and the tab bar with their own classes', () => {
    const { container, unmount } = renderNav(admin, { variant: 'top' })
    expect(container.querySelector('nav')).toHaveClass('nav-top')
    unmount()

    const tab = renderNav(admin, { variant: 'tab' })
    expect(tab.container.querySelector('nav')).toHaveClass('nav-tab')
  })
})

describe('UserMenu (user icon)', () => {
  it('does not appear when nobody is signed in', () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() })

    const { container } = render(<UserMenu />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows only the icon for signed-in people, the menu is closed', () => {
    useAuth.mockReturnValue({ user: admin, logout: vi.fn() })
    render(<UserMenu />)

    expect(screen.getByRole('button', { name: 'Benutzermenü' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('opens the menu with e-mail and role', async () => {
    useAuth.mockReturnValue({ user: admin, logout: vi.fn() })
    render(<UserMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('admin@checkin.de')).toBeInTheDocument()
    expect(screen.getByText('Administrator')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Benutzermenü' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('names employees by their role', async () => {
    useAuth.mockReturnValue({ user: mitarbeiter, logout: vi.fn() })
    render(<UserMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))

    expect(screen.getByText('Mitarbeiter')).toBeInTheDocument()
  })

  it('signs out via "Abmelden"', async () => {
    const logout = vi.fn()
    useAuth.mockReturnValue({ user: admin, logout })
    render(<UserMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))
    await userEvent.click(screen.getByRole('menuitem', { name: /Abmelden/ }))

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('closes with Escape', async () => {
    useAuth.mockReturnValue({ user: admin, logout: vi.fn() })
    render(<UserMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes on a click outside', async () => {
    useAuth.mockReturnValue({ user: admin, logout: vi.fn() })
    render(<div><span>daneben</span><UserMenu /></div>)
    await userEvent.click(screen.getByRole('button', { name: 'Benutzermenü' }))

    await userEvent.click(screen.getByText('daneben'))

    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes on a second click on the icon', async () => {
    useAuth.mockReturnValue({ user: admin, logout: vi.fn() })
    render(<UserMenu />)
    const icon = screen.getByRole('button', { name: 'Benutzermenü' })

    await userEvent.click(icon)
    await userEvent.click(icon)

    expect(screen.queryByRole('menu')).toBeNull()
  })
})
