import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminPanel from '../../pages/AdminPanel'
import UserView from '../../pages/UserView'

const { api } = vi.hoisted(() => ({ api: { get: vi.fn() } }))

vi.mock('../../api/api', () => ({ api }))

// Die Diagramme werden separat getestet; hier zählt, welche Daten die Seiten laden und weitergeben.
vi.mock('../../components/DashboardCharts', () => {
  const stub = (name) => ({ data }) => <div data-testid={name}>{Array.isArray(data) ? data.length : JSON.stringify(data)}</div>
  return {
    TrendChart: stub('trend'),
    WeekdayChart: stub('weekday'),
    DepartmentShareChart: stub('departments'),
    YearHeatmap: stub('heatmap'),
    AbsenceChart: stub('absence'),
    OfficeRanking: stub('ranking'),
    StatusDonut: stub('donut'),
    TeamWeekGrid: ({ data, tage }) => <div data-testid="teamgrid">{data.length}|{tage.join(',')}</div>,
    TargetMeter: ({ office, total }) => <div data-testid="meter">{office}/{total}</div>,
  }
})

const MITARBEITER = [
  { id: 'u1', firstName: 'Anna', lastName: 'Adler', abteilung: 'Administration' },
  { id: 'u2', firstName: 'Lukas', lastName: 'Müller', abteilung: 'Softwareentwicklung' },
  { id: 'u3', firstName: 'Sarah', lastName: 'Schmidt', abteilung: 'Softwareentwicklung' },
]

const OVERVIEW = {
  gesamt: { office: 98, homeOffice: 68, abwesend: 2, total: 168 },
  wochentage: [{}, {}, {}, {}, {}],
  abteilungen: [{ label: 'A' }, { label: 'B' }],
  ranking: [{}, {}, {}],
}

const aufrufe = (url) => api.get.mock.calls.filter(([u]) => u === url)
const letzterAufruf = (url) => aufrufe(url).at(-1)[1].params

beforeEach(() => {
  // Donnerstag, 05.11.2026 (KW 45)
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-05T10:00:00'))

  api.get.mockReset()
  api.get.mockImplementation(async (url) => {
    switch (url) {
      case '/User/mitarbeiter': return { data: MITARBEITER }
      case '/Dashboard/overview':
      case '/CheckIn/dashboard/overview': return { data: OVERVIEW }
      case '/Dashboard/verlauf':
      case '/CheckIn/dashboard/verlauf': return { data: new Array(12).fill({}) }
      case '/Dashboard/heatmap':
      case '/CheckIn/dashboard/heatmap': return { data: new Array(52).fill({}) }
      case '/Dashboard/team-woche': return { data: [{}, {}, {}] }
      default: throw new Error(`Unerwartete Anfrage: ${url}`)
    }
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Admin dashboard: loading', () => {
  it('loads the overview for the current month, the year data and the week grid', async () => {
    render(<AdminPanel />)

    await screen.findByText('58 %')

    expect(letzterAufruf('/Dashboard/overview')).toEqual({ von: '2026-11-01', bis: '2026-11-30' })
    expect(letzterAufruf('/Dashboard/verlauf')).toEqual({ jahr: 2026 })
    expect(letzterAufruf('/Dashboard/heatmap')).toEqual({ jahr: 2026 })
    expect(letzterAufruf('/Dashboard/team-woche')).toEqual({ montag: '2026-11-02', abteilung: undefined })
  })

  it('shows the key figures as rates', async () => {
    render(<AdminPanel />)

    expect(await screen.findByText('58 %')).toBeInTheDocument()   // Office 98 / 168
    expect(screen.getByText('40 %')).toBeInTheDocument()          // Home Office 68 / 168
    expect(screen.getByText('1 %')).toBeInTheDocument()           // Abwesend 2 / 168
    expect(screen.getByText('168')).toBeInTheDocument()
  })

  it('passes the loaded data on to the charts', async () => {
    render(<AdminPanel />)

    await screen.findByText('58 %')

    expect(screen.getByTestId('meter')).toHaveTextContent('98/168')
    expect(screen.getByTestId('trend')).toHaveTextContent('12')
    expect(screen.getByTestId('heatmap')).toHaveTextContent('52')
    expect(screen.getByTestId('weekday')).toHaveTextContent('5')
    expect(screen.getByTestId('departments')).toHaveTextContent('2')
    expect(screen.getByTestId('ranking')).toHaveTextContent('3')
    expect(screen.getByTestId('teamgrid')).toHaveTextContent('3|Mo 02.,Di 03.,Mi 04.,Do 05.,Fr 06.')
  })

  it('shows an error when the analysis fails to load', async () => {
    api.get.mockImplementation(async (url) => {
      if (url === '/Dashboard/overview') throw new Error('Serverfehler')
      return { data: [] }
    })
    render(<AdminPanel />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Auswertung konnte nicht geladen werden.')
  })
})

describe('Admin dashboard: period', () => {
  it('switches to the week (Monday to Sunday)', async () => {
    render(<AdminPanel />)
    await screen.findByText('58 %')

    await userEvent.click(screen.getByRole('button', { name: 'Woche' }))

    await waitFor(() => expect(letzterAufruf('/Dashboard/overview')).toEqual({ von: '2026-11-02', bis: '2026-11-08' }))
    expect(within(screen.getByLabelText('Zeitraum wechseln')).getByText('KW 45 · 02.11. – 08.11.')).toBeInTheDocument()
  })

  it('switches to the quarter', async () => {
    render(<AdminPanel />)
    await screen.findByText('58 %')

    await userEvent.click(screen.getByRole('button', { name: 'Quartal' }))

    await waitFor(() => expect(letzterAufruf('/Dashboard/overview')).toEqual({ von: '2026-10-01', bis: '2026-12-31' }))
    expect(within(screen.getByLabelText('Zeitraum wechseln')).getByText('Q4 2026')).toBeInTheDocument()
  })

  it('switches to the whole year and disables the arrows', async () => {
    render(<AdminPanel />)
    await screen.findByText('58 %')

    await userEvent.click(screen.getByRole('button', { name: 'Jahr' }))

    await waitFor(() => expect(letzterAufruf('/Dashboard/overview')).toEqual({ von: '2026-01-01', bis: '2026-12-31' }))
    expect(screen.getByRole('button', { name: 'Voriger Zeitraum' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nächster Zeitraum' })).toBeDisabled()
  })

  it('pages one month back', async () => {
    render(<AdminPanel />)
    await screen.findByText('58 %')

    await userEvent.click(screen.getByRole('button', { name: 'Voriger Zeitraum' }))

    await waitFor(() => expect(letzterAufruf('/Dashboard/overview')).toEqual({ von: '2026-10-01', bis: '2026-10-31' }))
    expect(within(screen.getByLabelText('Zeitraum wechseln')).getByText('Oktober 2026')).toBeInTheDocument()
  })

  it('pages the week grid independently of the period', async () => {
    render(<AdminPanel />)
    await screen.findByText('58 %')

    await userEvent.click(screen.getByRole('button', { name: 'Vorige Woche' }))

    await waitFor(() => expect(letzterAufruf('/Dashboard/team-woche').montag).toBe('2026-10-26'))
    expect(letzterAufruf('/Dashboard/overview')).toEqual({ von: '2026-11-01', bis: '2026-11-30' })
    expect(screen.getByTestId('teamgrid')).toHaveTextContent('Mo 26.,Di 27.,Mi 28.,Do 29.,Fr 30.')
  })
})

describe('Admin dashboard: filters', () => {
  it('offers only existing departments, sorted', async () => {
    render(<AdminPanel />)
    await screen.findByText('58 %')

    const abteilung = screen.getByLabelText('Abteilung')

    expect(within(abteilung).getAllByRole('option').map(o => o.textContent))
      .toEqual(['Alle Abteilungen', 'Administration', 'Softwareentwicklung'])
  })

  it('filters by department and limits the employee list to it', async () => {
    render(<AdminPanel />)
    await screen.findByText('58 %')

    await userEvent.selectOptions(screen.getByLabelText('Abteilung'), 'Softwareentwicklung')

    await waitFor(() => expect(letzterAufruf('/Dashboard/overview').abteilung).toBe('Softwareentwicklung'))
    expect(letzterAufruf('/Dashboard/verlauf').abteilung).toBe('Softwareentwicklung')
    expect(letzterAufruf('/Dashboard/team-woche').abteilung).toBe('Softwareentwicklung')
    expect(within(screen.getByLabelText('Mitarbeiter')).getAllByRole('option')).toHaveLength(3) // Alle + 2
  })

  it('filters by employee', async () => {
    render(<AdminPanel />)
    await screen.findByText('58 %')

    await userEvent.selectOptions(screen.getByLabelText('Mitarbeiter'), 'u2')

    await waitFor(() => expect(letzterAufruf('/Dashboard/overview').userId).toBe('u2'))
  })

  it('resets the employee when the department changes', async () => {
    render(<AdminPanel />)
    await screen.findByText('58 %')
    await userEvent.selectOptions(screen.getByLabelText('Mitarbeiter'), 'u2')

    await userEvent.selectOptions(screen.getByLabelText('Abteilung'), 'Administration')

    expect(screen.getByLabelText('Mitarbeiter')).toHaveValue('')
    await waitFor(() => expect(letzterAufruf('/Dashboard/overview').userId).toBeUndefined())
  })

  it('"Zurücksetzen" restores filters, period and week', async () => {
    render(<AdminPanel />)
    await screen.findByText('58 %')
    await userEvent.selectOptions(screen.getByLabelText('Abteilung'), 'Administration')
    await userEvent.click(screen.getByRole('button', { name: 'Quartal' }))
    await userEvent.click(screen.getByRole('button', { name: 'Vorige Woche' }))

    await userEvent.click(screen.getByRole('button', { name: 'Zurücksetzen' }))

    expect(screen.getByLabelText('Abteilung')).toHaveValue('')
    await waitFor(() => expect(letzterAufruf('/Dashboard/overview')).toEqual({ von: '2026-11-01', bis: '2026-11-30' }))
    expect(letzterAufruf('/Dashboard/team-woche').montag).toBe('2026-11-02')
    expect(screen.getByRole('button', { name: 'Monat' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Employee statistics', () => {
  it('loads only its own endpoints, never the admin data', async () => {
    render(<UserView />)

    await screen.findByText('Meine Statistik')
    await waitFor(() => expect(aufrufe('/CheckIn/dashboard/overview')).toHaveLength(1))

    expect(letzterAufruf('/CheckIn/dashboard/overview')).toEqual({ von: '2026-11-01', bis: '2026-11-30' })
    expect(letzterAufruf('/CheckIn/dashboard/verlauf')).toEqual({ jahr: 2026 })
    expect(letzterAufruf('/CheckIn/dashboard/heatmap')).toEqual({ jahr: 2026 })
    expect(api.get.mock.calls.some(([url]) => url.startsWith('/Dashboard'))).toBe(false)
    expect(api.get.mock.calls.some(([url]) => url.startsWith('/User'))).toBe(false)
  })

  it('shows the key figures as days', async () => {
    render(<UserView />)

    expect(await screen.findByText('98')).toBeInTheDocument()
    expect(screen.getByText('Office-Tage')).toBeInTheDocument()
    expect(screen.getByText('Home-Office-Tage')).toBeInTheDocument()
    expect(screen.getByText('Abwesend (Tage)')).toBeInTheDocument()
    expect(screen.getByText('168')).toBeInTheDocument()
  })

  it('shows target meter, donut, weekdays, trend and heatmap', async () => {
    render(<UserView />)

    await screen.findByText('98')

    expect(screen.getByTestId('meter')).toHaveTextContent('98/168')
    expect(screen.getByTestId('donut')).toHaveTextContent('"office":98')
    expect(screen.getByTestId('weekday')).toHaveTextContent('5')
    expect(screen.getByTestId('trend')).toHaveTextContent('12')
    expect(screen.getByTestId('heatmap')).toHaveTextContent('52')
  })

  it('shows no admin elements (department comparison, ranking, filters)', async () => {
    render(<UserView />)

    await screen.findByText('98')

    expect(screen.queryByTestId('departments')).toBeNull()
    expect(screen.queryByTestId('ranking')).toBeNull()
    expect(screen.queryByTestId('teamgrid')).toBeNull()
    expect(screen.queryByLabelText('Abteilung')).toBeNull()
  })

  it('reloads when the period changes', async () => {
    render(<UserView />)
    await screen.findByText('98')

    await userEvent.click(screen.getByRole('button', { name: 'Quartal' }))

    await waitFor(() => expect(letzterAufruf('/CheckIn/dashboard/overview')).toEqual({ von: '2026-10-01', bis: '2026-12-31' }))
  })

  it('shows an error when the statistics fail to load', async () => {
    api.get.mockRejectedValue(new Error('Serverfehler'))
    render(<UserView />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Deine Statistik konnte nicht geladen werden.')
  })
})
