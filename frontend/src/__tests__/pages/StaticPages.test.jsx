import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Impressum from '../../pages/Impressum'
import Datenschutz from '../../pages/Datenschutz'
import Login from '../../pages/Login'
import Dashboard from '../../pages/Dashboard'
import { useAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../pages/UserView', () => ({ default: () => <p>Mitarbeiter-Statistik</p> }))
vi.mock('../../pages/AdminPanel', () => ({ default: () => <p>Admin-Auswertungen</p> }))

const inRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

beforeEach(() => {
  useAuth.mockReset()
})

describe('Impressum', () => {
  it('zeigt die Pflichtangaben', () => {
    inRouter(<Impressum />)

    expect(screen.getByRole('heading', { level: 1, name: 'Impressum' })).toBeInTheDocument()
    expect(screen.getByText(/Angaben gemäß § 5 DDG/)).toBeInTheDocument()
    expect(screen.getByText(/Muster Software GmbH/)).toBeInTheDocument()
    expect(screen.getByText(/Umsatzsteuer-Identifikationsnummer/)).toBeInTheDocument()
  })

  it('nennt überall denselben Namen wie das Admin-Konto (Max Mustermann)', () => {
    inRouter(<Impressum />)

    expect(screen.getAllByText(/Max Mustermann/).length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText(/Erika/)).toBeNull()
  })

  it('kennzeichnet alle Angaben als fiktiv', () => {
    inRouter(<Impressum />)

    expect(screen.getByText(/fiktives Demoprojekt/, { selector: '.legal-note' })).toBeInTheDocument()
  })

  it('führt zurück zur Anmeldung und enthält den Footer', () => {
    inRouter(<Impressum />)

    expect(screen.getByRole('link', { name: /Zurück zur Anmeldung/ })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute('href', '/datenschutz')
  })
})

describe('Datenschutzerklärung', () => {
  it('enthält die DSGVO-Pflichtabschnitte', () => {
    inRouter(<Datenschutz />)

    const ueberschriften = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)
    expect(ueberschriften).toEqual(expect.arrayContaining([
      '1. Verantwortlicher',
      '2. Zweck der Anwendung',
      '3. Verarbeitete Daten',
      '4. Rechtsgrundlagen',
      '6. Cookies und lokale Speicherung',
      '8. Ihre Rechte',
    ]))
  })

  it('nennt Speicherdauern in einer Tabelle', () => {
    inRouter(<Datenschutz />)

    expect(screen.getByRole('columnheader', { name: 'Speicherdauer' })).toBeInTheDocument()
    expect(screen.getByText(/24 Monate/)).toBeInTheDocument()
    expect(screen.getByText(/Maximal 7 Tage/)).toBeInTheDocument()
  })

  it('nennt die Betroffenenrechte und das Beschwerderecht', () => {
    inRouter(<Datenschutz />)

    expect(screen.getByText(/Auskunft über Ihre gespeicherten Daten \(Art\. 15\)/)).toBeInTheDocument()
    expect(screen.getByText(/Löschung \(Art\. 17\)/)).toBeInTheDocument()
    expect(screen.getByText(/Art\. 77 DSGVO/)).toBeInTheDocument()
  })

  it('erklärt, dass nur ein technisch notwendiges Cookie genutzt wird', () => {
    inRouter(<Datenschutz />)

    expect(screen.getByText(/ausschließlich ein technisch notwendiges Cookie/)).toBeInTheDocument()
    expect(screen.getByText(/kein Cookie-Banner/)).toBeInTheDocument()
  })

  it('kennzeichnet den Text als fiktiv', () => {
    inRouter(<Datenschutz />)

    expect(screen.getByText(/fiktives Demoprojekt/, { selector: '.legal-note' })).toBeInTheDocument()
  })
})

describe('Dashboard-Weiche', () => {
  it('zeigt Mitarbeitern ihre eigene Statistik', () => {
    useAuth.mockReturnValue({ user: { role: 'Mitarbeiter' } })
    render(<Dashboard />)

    expect(screen.getByText('Mitarbeiter-Statistik')).toBeInTheDocument()
    expect(screen.queryByText('Admin-Auswertungen')).toBeNull()
  })

  it('zeigt Admins die Gesamt-Auswertung', () => {
    useAuth.mockReturnValue({ user: { role: 'Admin' } })
    render(<Dashboard />)

    expect(screen.getByText('Admin-Auswertungen')).toBeInTheDocument()
    expect(screen.queryByText('Mitarbeiter-Statistik')).toBeNull()
  })

  it('zeigt ohne Rolle nichts an', () => {
    useAuth.mockReturnValue({ user: null })
    const { container } = render(<Dashboard />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('Login', () => {
  const renderLogin = (login = vi.fn()) => {
    useAuth.mockReturnValue({ login })
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<p>Dashboard erreicht</p>} />
        </Routes>
      </MemoryRouter>,
    )
    return login
  }

  it('zeigt Formular und Footer mit den Rechtsseiten', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: /Willkommen bei CheckIn/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Passwort')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('link', { name: 'Impressum' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Datenschutz' })).toBeInTheDocument()
  })

  it('meldet an, übergibt den Token und leitet auf das Dashboard', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'tok', roles: ['Admin'] } })
    const login = renderLogin()

    await userEvent.type(screen.getByLabelText('Email'), 'admin@checkin.de')
    await userEvent.type(screen.getByLabelText('Passwort'), 'Admin123!')
    await userEvent.click(screen.getByRole('button', { name: 'Einloggen' }))

    expect(await screen.findByText('Dashboard erreicht')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/Auth/login'),
      { email: 'admin@checkin.de', password: 'Admin123!' },
      { withCredentials: true },
    )
    expect(login).toHaveBeenCalledWith('tok', ['Admin'])
  })

  it('bleibt bei falschen Zugangsdaten auf der Login-Seite', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue({ response: { status: 400 } })
    const login = renderLogin()

    await userEvent.type(screen.getByLabelText('Email'), 'x@y.de')
    await userEvent.type(screen.getByLabelText('Passwort'), 'Falsch123!')
    await userEvent.click(screen.getByRole('button', { name: 'Einloggen' }))

    expect(await screen.findByText('Email oder Passwort falsch')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
    expect(screen.queryByText('Dashboard erreicht')).toBeNull()
  })
})
