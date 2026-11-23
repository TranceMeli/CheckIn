import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LanguageProvider } from '../../i18n/LanguageContext'
import { STORAGE_KEY } from '../../i18n/i18n'
import LanguageSwitch from '../../components/LanguageSwitch'
import Footer from '../../components/Footer'
import Navbar from '../../components/Navbar'
import UserMenu from '../../components/UserMenu'
import PeriodBar from '../../components/PeriodBar'
import Impressum from '../../pages/Impressum'
import Datenschutz from '../../pages/Datenschutz'
import { TargetMeter, TeamWeekGrid, YearHeatmap, StatusDonut, OfficeRanking } from '../../components/DashboardCharts'
import { zeitraum } from '../../utils/zeitraum'
import { useAuth } from '../../contexts/AuthContext'

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.lang = ''
  useAuth.mockReset()
})

const mitEnglisch = (ui) => {
  window.localStorage.setItem(STORAGE_KEY, 'en')
  return render(<LanguageProvider><MemoryRouter>{ui}</MemoryRouter></LanguageProvider>)
}

describe('Language switch', () => {
  const renderSwitch = () => render(
    <LanguageProvider>
      <MemoryRouter>
        <LanguageSwitch />
        <Footer />
      </MemoryRouter>
    </LanguageProvider>,
  )

  it('starts in German with DE selected', () => {
    renderSwitch()

    expect(screen.getByRole('button', { name: /Deutsch/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /English/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('© 2026 CheckIn – fiktives Demoprojekt')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('de')
  })

  it('switches all texts to English on a click', async () => {
    renderSwitch()

    await userEvent.click(screen.getByRole('button', { name: /English/ }))

    expect(screen.getByRole('button', { name: /English/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('© 2026 CheckIn – fictional demo project')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Legal notice' })).toHaveAttribute('href', '/impressum')
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/datenschutz')
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument()
  })

  it('switches back to German', async () => {
    renderSwitch()

    await userEvent.click(screen.getByRole('button', { name: /English/ }))
    await userEvent.click(screen.getByRole('button', { name: /Deutsch/ }))

    expect(screen.getByRole('link', { name: 'Impressum' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('de')
  })

  it('sets the page language and remembers the choice', async () => {
    renderSwitch()

    await userEvent.click(screen.getByRole('button', { name: /English/ }))

    expect(document.documentElement.lang).toBe('en')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en')
  })

  it('restores the remembered language on the next visit', () => {
    window.localStorage.setItem(STORAGE_KEY, 'en')
    renderSwitch()

    expect(screen.getByRole('button', { name: /English/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: 'Legal notice' })).toBeInTheDocument()
  })

  it('marks each button with its own language for screen readers', () => {
    renderSwitch()

    expect(screen.getByRole('button', { name: /Deutsch/ })).toHaveAttribute('lang', 'de')
    expect(screen.getByRole('button', { name: /English/ })).toHaveAttribute('lang', 'en')
  })

  it('shows German texts without a provider', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'Impressum' })).toBeInTheDocument()
  })
})

describe('English interface', () => {
  it('shows admins Dashboard, Manage and Export', () => {
    useAuth.mockReturnValue({ user: { email: 'admin@checkin.de', role: 'Admin' } })
    mitEnglisch(<Navbar />)

    expect(screen.getAllByRole('link').map(l => l.textContent)).toEqual(['Dashboard', 'Manage', 'Export'])
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
  })

  it('shows employees Check-in and Dashboard', () => {
    useAuth.mockReturnValue({ user: { email: 'l.mueller@checkin.de', role: 'Mitarbeiter' } })
    mitEnglisch(<Navbar />)

    expect(screen.getAllByRole('link').map(l => l.textContent)).toEqual(['Check-in', 'Dashboard'])
  })

  it('names the role and the sign-out action in English', async () => {
    useAuth.mockReturnValue({ user: { email: 'l.mueller@checkin.de', role: 'Mitarbeiter' }, logout: vi.fn() })
    mitEnglisch(<UserMenu />)

    await userEvent.click(screen.getByRole('button', { name: 'User menu' }))

    expect(screen.getByText('Employee')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('shows the period buttons in English', () => {
    mitEnglisch(<PeriodBar periode="month" anker={new Date(2026, 5, 15)} label="June 2026" onPeriode={() => {}} onAnker={() => {}} />)

    for (const name of ['Week', 'Month', 'Quarter', 'Year']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Previous period' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next period' })).toBeInTheDocument()
  })

  it('describes the target meter in English', () => {
    mitEnglisch(<TargetMeter office={9} total={20} />)

    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText('of 60% target')).toBeInTheDocument()
    expect(screen.getByText('15 percentage points below the target.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Office rate 45 percent, target 60 percent' })).toBeInTheDocument()
  })

  it('says so in English when nothing was recorded', () => {
    mitEnglisch(<TargetMeter office={0} total={0} />)

    expect(screen.getByText('No check-ins in this period.')).toBeInTheDocument()
  })

  it('translates weekday, status and department in the week grid', () => {
    const data = [{ userId: '1', name: 'Anna Becker', abteilung: 'Vertrieb', tage: ['Office', 'HomeOffice', 'Abwesend', null, 'Office'] }]
    mitEnglisch(<TeamWeekGrid data={data} tage={['Mon 16', 'Tue 17', 'Wed 18', 'Thu 19', 'Fri 20']} />)

    expect(screen.getByText('Sales')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Abs.')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Mon 16' })).toBeInTheDocument()
  })

  it('shows the empty states in English', () => {
    mitEnglisch(<StatusDonut data={{ office: 0, homeOffice: 0, abwesend: 0 }} />)

    expect(screen.getByText('No data for this period')).toBeInTheDocument()
  })

  it('describes the heatmap in English', () => {
    mitEnglisch(<YearHeatmap data={[{ woche: 1, office: 3, total: 4 }, { woche: 2, office: 0, total: 0 }]} />)

    expect(screen.getByRole('img', { name: 'Office share per calendar week in 2026' })).toBeInTheDocument()
    expect(screen.getByTitle('CW 1: 75% office')).toBeInTheDocument()
    expect(screen.getByTitle('CW 2: no data')).toBeInTheDocument()
    expect(screen.getByText('little office')).toBeInTheDocument()
  })

  it('translates the department in the ranking', () => {
    mitEnglisch(<OfficeRanking data={[{ userId: '1', name: 'Anna Becker', abteilung: 'Kundenservice', office: 12 }]} />)

    expect(screen.getByText('Customer service')).toBeInTheDocument()
  })

  it('shows the imprint in English with a note that the German version applies', () => {
    mitEnglisch(<Impressum />)

    expect(screen.getByRole('heading', { level: 1, name: 'Legal notice' })).toBeInTheDocument()
    expect(screen.getByText(/the German version is authoritative/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to sign-in/ })).toBeInTheDocument()
  })

  it('shows the privacy policy in English', () => {
    mitEnglisch(<Datenschutz />)

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '8. Your rights' })).toBeInTheDocument()
    const tabelle = screen.getByRole('table')
    expect(within(tabelle).getByText(/At most 14 days/)).toBeInTheDocument()
  })

  it('offers the switch on the legal pages', () => {
    mitEnglisch(<Impressum />)

    expect(screen.getByRole('button', { name: /Deutsch/ })).toBeInTheDocument()
  })
})

describe('Period labels per language', () => {
  const montag = new Date(2026, 10, 18) // Mittwoch, KW 47

  it('names the week, month, quarter and year in German by default', () => {
    expect(zeitraum('week', montag).label).toBe('KW 47 · 16.11. – 22.11.')
    expect(zeitraum('month', montag).label).toBe('November 2026')
    expect(zeitraum('quarter', montag).label).toBe('Q4 2026')
    expect(zeitraum('year', montag).label).toBe('Jahr 2026')
  })

  it('names them in English', () => {
    expect(zeitraum('week', montag, 'en').label).toBe('CW 47 · 16/11 – 22/11')
    expect(zeitraum('month', montag, 'en').label).toBe('November 2026')
    expect(zeitraum('month', new Date(2026, 2, 1), 'en').label).toBe('March 2026')
    expect(zeitraum('quarter', montag, 'en').label).toBe('Q4 2026')
    expect(zeitraum('year', montag, 'en').label).toBe('Year 2026')
  })

  it('keeps the same dates in both languages', () => {
    expect(zeitraum('week', montag, 'en').von).toEqual(zeitraum('week', montag, 'de').von)
  })
})
