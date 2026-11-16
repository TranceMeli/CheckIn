import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminManage from '../../pages/AdminManage'

const { api, toast } = vi.hoisted(() => ({
  api: Object.assign(vi.fn(), { get: vi.fn() }),
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

vi.mock('../../api/api', () => ({ api }))
vi.mock('react-hot-toast', () => ({ toast, Toaster: () => null }))

const MITARBEITER = [
  { id: 'u1', firstName: 'Anna', lastName: 'Adler', abteilung: 'Administration' },
  { id: 'u2', firstName: 'Lukas', lastName: 'Müller', abteilung: 'Softwareentwicklung' },
  { id: 'u3', firstName: 'Sarah', lastName: 'Schmidt', abteilung: 'Softwareentwicklung' },
]

// Donnerstag, 05.11.2026: Werktag, daher wird "Heute noch nicht eingecheckt" geladen
const HEUTE = '2026-11-05'

let eintraege
let fehlend

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(`${HEUTE}T10:00:00`))

  eintraege = [
    { datum: '2026-11-05', status: 'HomeOffice' },
    { datum: '2026-11-04', status: 'Office' },
  ]
  fehlend = [
    { userId: 'u2', name: 'Lukas Müller', abteilung: 'Softwareentwicklung', tage: ['Office', 'Office', 'Office', null, null] },
    { userId: 'u3', name: 'Sarah Schmidt', abteilung: 'Softwareentwicklung', tage: ['Office', 'Office', 'Office', 'Office', null] },
  ]

  api.mockReset()
  api.get.mockReset()
  toast.success.mockReset()
  toast.error.mockReset()

  api.get.mockImplementation(async (url) => {
    if (url === '/User/mitarbeiter') return { data: MITARBEITER }
    if (url === '/Dashboard/team-woche') return { data: fehlend }
    if (/\/User\/.+\/checkins/.test(url)) return { data: eintraege }
    throw new Error(`Unerwartete Anfrage: ${url}`)
  })
})

afterEach(() => {
  vi.useRealTimers()
})

const waehleMitarbeiter = async (id = 'u1') => {
  await screen.findByRole('option', { name: 'Anna Adler' })
  await userEvent.selectOptions(screen.getByRole('combobox'), id)
}

describe('Verwalten: Mitarbeiterauswahl', () => {
  it('lädt nur Mitarbeiter (nicht die Liste mit Admins)', async () => {
    render(<AdminManage />)

    await screen.findByRole('option', { name: 'Anna Adler' })

    expect(api.get).toHaveBeenCalledWith('/User/mitarbeiter')
    expect(api.get).not.toHaveBeenCalledWith('/User')
    expect(screen.queryByRole('option', { name: /Mustermann/ })).toBeNull()
  })

  it('gruppiert die Mitarbeiter nach Abteilung', async () => {
    render(<AdminManage />)

    await screen.findByRole('option', { name: 'Anna Adler' })

    const gruppen = screen.getAllByRole('group').filter(g => g.tagName === 'OPTGROUP')
    expect(gruppen.map(g => g.getAttribute('label'))).toEqual(['Administration', 'Softwareentwicklung'])
    expect(within(gruppen[1]).getAllByRole('option')).toHaveLength(2)
  })

  it('schlägt als Datum heute vor und sperrt die Zukunft', async () => {
    render(<AdminManage />)

    const datum = await screen.findByLabelText('Datum')

    expect(datum).toHaveValue(HEUTE)
    expect(datum).toHaveAttribute('max', HEUTE)
    expect(datum).toHaveAttribute('min', '2026-01-01')
  })

  it('deaktiviert den Speichern-Button, bis jemand gewählt ist', async () => {
    render(<AdminManage />)

    expect(await screen.findByRole('button', { name: 'Nachtragen' })).toBeDisabled()
  })
})

describe('Verwalten: Einträge des Monats', () => {
  it('zeigt vor der Auswahl einen Hinweis statt einer Liste', async () => {
    render(<AdminManage />)

    expect(await screen.findByText(/Wähle einen Mitarbeiter/)).toBeInTheDocument()
  })

  it('lädt nach der Auswahl die Einträge des Monats', async () => {
    render(<AdminManage />)

    await waehleMitarbeiter('u1')

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/User/u1/checkins', {
      params: { von: '2026-11-01', bis: '2026-11-30' },
    }))
    expect(await screen.findByText('Do., 05.11.')).toBeInTheDocument()
    expect(screen.getByText('Mi., 04.11.')).toBeInTheDocument()
  })

  it('zeigt einen Leerzustand, wenn es im Monat keine Einträge gibt', async () => {
    eintraege = []
    render(<AdminManage />)

    await waehleMitarbeiter('u1')

    expect(await screen.findByText('Keine Einträge in diesem Monat.')).toBeInTheDocument()
  })

  it('übernimmt Datum und Status per "Bearbeiten" ins Formular', async () => {
    render(<AdminManage />)
    await waehleMitarbeiter('u1')
    const zeile = (await screen.findByText('Mi., 04.11.')).closest('li')

    await userEvent.click(within(zeile).getByRole('button', { name: 'Bearbeiten' }))

    expect(screen.getByLabelText('Datum')).toHaveValue('2026-11-04')
    expect(screen.getByRole('radio', { name: 'Office' })).toBeChecked()
  })
})

describe('Verwalten: nachtragen und korrigieren', () => {
  it('weist auf einen vorhandenen Eintrag hin und bietet "Eintrag ändern" an', async () => {
    render(<AdminManage />)

    await waehleMitarbeiter('u1') // heute (05.11.) hat schon "Home Office"

    expect(await screen.findByRole('status')).toHaveTextContent('gibt es schon einen Eintrag: Home Office')
    expect(screen.getByRole('button', { name: 'Eintrag ändern' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nachtragen' })).toBeNull()
  })

  it('bietet "Nachtragen" an, wenn für den Tag noch nichts existiert', async () => {
    eintraege = [{ datum: '2026-11-04', status: 'Office' }]
    render(<AdminManage />)

    await waehleMitarbeiter('u1')

    expect(await screen.findByRole('button', { name: 'Nachtragen' })).toBeEnabled()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('sendet beim Nachtragen ein POST mit Status und Datum', async () => {
    eintraege = []
    api.mockResolvedValue({ data: { gespeichert: true } })
    render(<AdminManage />)
    await waehleMitarbeiter('u1')

    await userEvent.click(screen.getByRole('radio', { name: 'Abwesend' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Nachtragen' }))

    await waitFor(() => expect(api).toHaveBeenCalledWith({
      method: 'post',
      url: '/User/u1/checkin',
      data: { status: 'Abwesend', datum: HEUTE },
    }))
    expect(toast.success).toHaveBeenCalledWith('Check-in nachgetragen.')
  })

  it('sendet beim Korrigieren ein PUT', async () => {
    api.mockResolvedValue({ data: { gespeichert: true } })
    render(<AdminManage />)
    await waehleMitarbeiter('u1') // vorhanden: Home Office

    await userEvent.click(screen.getByRole('radio', { name: 'Office' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Eintrag ändern' }))

    await waitFor(() => expect(api).toHaveBeenCalledWith({
      method: 'put',
      url: '/User/u1/checkin',
      data: { status: 'Office', datum: HEUTE },
    }))
    expect(toast.success).toHaveBeenCalledWith('Eintrag geändert.')
  })

  it('lässt "Eintrag ändern" gesperrt, solange der Status unverändert ist', async () => {
    render(<AdminManage />)
    await waehleMitarbeiter('u1') // vorhanden: Home Office, vorbelegt ist Office

    await userEvent.click(screen.getByRole('radio', { name: 'Home Office' }))

    expect(await screen.findByRole('button', { name: 'Eintrag ändern' })).toBeDisabled()
  })

  it('zeigt bei einem 409 den bestehenden Status, statt zu überschreiben', async () => {
    eintraege = []
    api.mockRejectedValue({ response: { status: 409, data: { bestehenderStatus: 'Office' } } })
    render(<AdminManage />)
    await waehleMitarbeiter('u1')

    await userEvent.click(await screen.findByRole('button', { name: 'Nachtragen' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Office')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('meldet ein Zukunftsdatum (400) verständlich', async () => {
    eintraege = []
    api.mockRejectedValue({ response: { status: 400 } })
    render(<AdminManage />)
    await waehleMitarbeiter('u1')

    await userEvent.click(await screen.findByRole('button', { name: 'Nachtragen' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Für dieses Datum kann nichts nachgetragen werden.'))
  })

  it('meldet andere Fehler allgemein', async () => {
    eintraege = []
    api.mockRejectedValue({ response: { status: 500 } })
    render(<AdminManage />)
    await waehleMitarbeiter('u1')

    await userEvent.click(await screen.findByRole('button', { name: 'Nachtragen' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Speichern fehlgeschlagen.'))
  })
})

describe('Verwalten: "Heute noch nicht eingecheckt"', () => {
  it('fragt die aktuelle Woche ab (Montag als Startdatum)', async () => {
    render(<AdminManage />)

    await screen.findByRole('option', { name: 'Anna Adler' })

    expect(api.get).toHaveBeenCalledWith('/Dashboard/team-woche', { params: { montag: '2026-11-02' } })
  })

  it('listet nur Personen ohne Eintrag am heutigen Wochentag', async () => {
    render(<AdminManage />)

    // Donnerstag = Index 3: Lukas fehlt noch, Sarah hat schon eingecheckt
    const liste = await screen.findByRole('button', { name: /Lukas Müller/ })

    expect(liste).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sarah Schmidt/ })).toBeNull()
    expect(screen.getByText('Heute noch nicht eingecheckt').closest('h3')).toHaveTextContent('1')
  })

  it('füllt das Formular per Klick auf den Namen vor', async () => {
    render(<AdminManage />)

    await userEvent.click(await screen.findByRole('button', { name: /Lukas Müller/ }))

    expect(screen.getByRole('combobox')).toHaveValue('u2')
    expect(screen.getByLabelText('Datum')).toHaveValue(HEUTE)
  })

  it('freut sich, wenn alle eingecheckt haben', async () => {
    fehlend = fehlend.map(m => ({ ...m, tage: ['Office', 'Office', 'Office', 'Office', null] }))
    render(<AdminManage />)

    expect(await screen.findByText('Alle Mitarbeiter haben heute eingecheckt.')).toBeInTheDocument()
  })
})
