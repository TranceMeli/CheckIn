import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '../../layout/MainLayout'
import ExportTable from '../../components/ExportTable'
import { useAuth } from '../../contexts/AuthContext'

const { api } = vi.hoisted(() => ({ api: { get: vi.fn() } }))

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../api/api', () => ({ api }))
vi.mock('jspdf', () => ({ default: vi.fn() }))
vi.mock('jspdf-autotable', () => ({ default: vi.fn() }))

beforeEach(() => {
  useAuth.mockReset()
  api.get.mockReset()
})

describe('MainLayout', () => {
  const renderLayout = (user) => {
    useAuth.mockReturnValue({ user, logout: vi.fn() })
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<p>Seiteninhalt</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
  }

  it('shows logo, page content and footer', () => {
    renderLayout({ email: 'admin@checkin.de', role: 'Admin' })

    expect(screen.getByText('CheckIn')).toBeInTheDocument()
    expect(screen.getByText('Seiteninhalt')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Impressum' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Datenschutz' })).toBeInTheDocument()
  })

  it('has two navigations: top for desktop and a tab bar at the bottom', () => {
    const { container } = renderLayout({ email: 'admin@checkin.de', role: 'Admin' })

    expect(container.querySelector('nav.nav-top')).not.toBeNull()
    expect(container.querySelector('nav.nav-tab')).not.toBeNull()
  })

  it('shows the user icon for signed-in people', () => {
    renderLayout({ email: 'admin@checkin.de', role: 'Admin' })

    expect(screen.getByRole('button', { name: 'Benutzermenü' })).toBeInTheDocument()
  })

  it('puts the footer inside the scrolling content area (reachable on phones too)', () => {
    const { container } = renderLayout({ email: 'admin@checkin.de', role: 'Admin' })

    expect(container.querySelector('main.main footer')).not.toBeNull()
  })
})

describe('ExportTable', () => {
  const ZEILEN = [
    { datum: '02.11.2026', vorname: 'Anna', nachname: 'Adler', status: 'Office', abteilung: 'Administration' },
    { datum: '03.11.2026', vorname: 'Lukas', nachname: 'Müller', status: 'HomeOffice', abteilung: 'Softwareentwicklung' },
  ]

  const mockApi = (zeilen = ZEILEN) =>
    api.get.mockImplementation(async (url) => {
      if (url === '/User/mitarbeiter') return { data: [{ abteilung: 'Softwareentwicklung' }, { abteilung: 'Administration' }] }
      if (url.startsWith('/User/export')) return { data: zeilen }
      throw new Error(`Unerwartete Anfrage: ${url}`)
    })

  it('takes the departments only from the employee list and sorts them', async () => {
    mockApi()
    render(<ExportTable />)

    const select = (await screen.findAllByRole('combobox')).at(-1)

    await waitFor(() => expect(within(select).getAllByRole('option').map(o => o.textContent))
      .toEqual(['Alle Abteilungen', 'Administration', 'Softwareentwicklung']))
    expect(api.get).toHaveBeenCalledWith('/User/mitarbeiter')
    expect(api.get).not.toHaveBeenCalledWith('/User')
  })

  it('shows the rows of the export', async () => {
    mockApi()
    render(<ExportTable />)

    expect(await screen.findByText('Anna')).toBeInTheDocument()
    expect(screen.getByText('Müller')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(3) // Kopf + 2
  })

  it('offers only the year 2026', async () => {
    mockApi()
    render(<ExportTable />)
    await screen.findByText('Anna')

    const jahr = screen.getAllByRole('combobox')[1]

    expect(within(jahr).getAllByRole('option').map(o => o.textContent)).toEqual(['2026'])
  })

  it('shows an empty state and disables the downloads without data', async () => {
    mockApi([])
    render(<ExportTable />)

    expect(await screen.findByText('Keine Einträge für diesen Zeitraum')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'CSV herunterladen' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'PDF herunterladen' })).toBeDisabled()
  })

  it('filters the export by department', async () => {
    mockApi()
    render(<ExportTable />)
    await screen.findByText('Anna')

    const select = screen.getAllByRole('combobox').at(-1)
    await waitFor(() => expect(within(select).getAllByRole('option')).toHaveLength(3))
    await userEvent.selectOptions(select, 'Administration')

    await waitFor(() => {
      const letzter = api.get.mock.calls.map(c => c[0]).filter(u => u.startsWith('/User/export')).at(-1)
      expect(letzter).toContain('abteilung=Administration')
      expect(letzter).toContain('jahr=2026')
    })
  })

  it('creates a CSV with BOM, semicolon and header row', async () => {
    mockApi()
    let blob
    URL.createObjectURL = vi.fn((b) => { blob = b; return 'blob:test' })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<ExportTable />)
    await screen.findByText('Anna')

    await userEvent.click(screen.getByRole('button', { name: 'CSV herunterladen' }))

    // readAsText entfernt ein BOM beim Dekodieren, deshalb werden die Rohbytes geprüft
    const bytes = new Uint8Array(await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsArrayBuffer(blob)
    }))
    expect([...bytes.slice(0, 3)]).toEqual([0xEF, 0xBB, 0xBF])
    const text = new TextDecoder().decode(bytes.slice(3))
    const zeilen = text.split('\n')
    expect(zeilen[0]).toBe('Datum;Vorname;Nachname;Status;Abteilung')
    expect(zeilen[1]).toBe('02.11.2026;Anna;Adler;Office;Administration')
    expect(zeilen).toHaveLength(3)
  })
})
