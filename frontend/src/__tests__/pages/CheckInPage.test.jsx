import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckInPage from '../../pages/CheckInPage'

const { api, toast } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

vi.mock('../../api/api', () => ({ api }))
vi.mock('react-hot-toast', () => ({ toast, Toaster: () => null }))

beforeEach(() => {
  api.get.mockReset()
  api.post.mockReset()
  toast.success.mockReset()
  toast.error.mockReset()
})

const nochNichtEingecheckt = () => api.get.mockRejectedValue({ response: { status: 404 } })
const bereitsEingecheckt = (status = 'HomeOffice') =>
  api.get.mockResolvedValue({ data: { status, alreadyCheckedIn: true } })

describe('Check-in-Seite: Auswahlkarten', () => {
  it('zeigt die drei Statuskarten', async () => {
    nochNichtEingecheckt()
    render(<CheckInPage />)

    expect(await screen.findByText('Home Office')).toBeInTheDocument()
    expect(screen.getByText('Office')).toBeInTheDocument()
    expect(screen.getByText('Abwesend')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('legt die Karten in ein Raster, das responsiv umbricht', async () => {
    nochNichtEingecheckt()
    const { container } = render(<CheckInPage />)
    await screen.findByText('Office')

    expect(container.querySelector('.checkin-page > .container')).not.toBeNull()
    expect(container.querySelectorAll('.container .card')).toHaveLength(3)
  })

  it('zeigt vor dem Check-in keinen Hinweis', async () => {
    nochNichtEingecheckt()
    render(<CheckInPage />)
    await screen.findByText('Office')

    expect(screen.queryByText(/bereits eingecheckt/)).toBeNull()
  })

  it('zeigt den Einchecken-Button erst bei einer gewählten Karte', async () => {
    nochNichtEingecheckt()
    render(<CheckInPage />)
    await screen.findByText('Office')
    expect(screen.queryByRole('button', { name: 'Einchecken' })).toBeNull()

    await userEvent.click(screen.getByText('Office'))

    expect(screen.getByRole('button', { name: 'Einchecken' })).toBeEnabled()
  })
})

describe('Check-in-Seite: Einchecken', () => {
  it('sendet den gewählten Status und bestätigt', async () => {
    nochNichtEingecheckt()
    api.post.mockResolvedValue({ data: {} })
    render(<CheckInPage />)
    await screen.findByText('Office')

    await userEvent.click(screen.getByText('Abwesend'))
    await userEvent.click(screen.getByRole('button', { name: 'Einchecken' }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/CheckIn/set-status', { status: 'Abwesend' }))
    expect(toast.success).toHaveBeenCalledWith('Erfolgreich eingecheckt!')
  })

  it('zeigt nach dem Einchecken den Hinweis und sperrt die Auswahl', async () => {
    nochNichtEingecheckt()
    api.post.mockResolvedValue({ data: {} })
    render(<CheckInPage />)
    await screen.findByText('Office')

    await userEvent.click(screen.getByText('Office'))
    await userEvent.click(screen.getByRole('button', { name: 'Einchecken' }))

    expect(await screen.findByText('Du hast heute bereits eingecheckt.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Einchecken' })).toBeDisabled()
  })

  it('meldet einen Fehler beim Speichern und checkt nicht ein', async () => {
    nochNichtEingecheckt()
    api.post.mockRejectedValue(new Error('Server weg'))
    render(<CheckInPage />)
    await screen.findByText('Office')

    await userEvent.click(screen.getByText('Office'))
    await userEvent.click(screen.getByRole('button', { name: 'Einchecken' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Speichern fehlgeschlagen'))
    expect(screen.queryByText(/bereits eingecheckt/)).toBeNull()
  })
})

describe('Check-in-Seite: bereits eingecheckt', () => {
  it('zeigt den großen Hinweis mit Statusmeldung', async () => {
    bereitsEingecheckt()
    render(<CheckInPage />)

    const hinweis = await screen.findByRole('status')

    expect(hinweis).toHaveTextContent('Du hast heute bereits eingecheckt.')
    expect(hinweis).toHaveClass('checkin-note')
  })

  it('wählt den heutigen Status vor und sperrt die anderen Karten', async () => {
    bereitsEingecheckt('HomeOffice')
    const { container } = render(<CheckInPage />)
    await screen.findByRole('status')

    expect(screen.getByRole('radio', { name: /Home Office/ })).toBeChecked()
    expect(container.querySelectorAll('.card.disabled')).toHaveLength(2)
    expect(container.querySelector('.card.active')).toHaveTextContent('Home Office')
  })

  it('sperrt den Einchecken-Button', async () => {
    bereitsEingecheckt('Office')
    render(<CheckInPage />)

    expect(await screen.findByRole('button', { name: 'Einchecken' })).toBeDisabled()
  })

  it('sendet nichts, wenn trotzdem geklickt wird', async () => {
    bereitsEingecheckt('Office')
    render(<CheckInPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Einchecken' }))

    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('Check-in-Seite: Ladefehler', () => {
  it('zeigt bei einem Serverfehler eine Meldung', async () => {
    api.get.mockRejectedValue({ response: { status: 500 } })
    render(<CheckInPage />)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Laden der Daten'))
  })

  it('behandelt 404 (noch kein Eintrag) nicht als Fehler', async () => {
    nochNichtEingecheckt()
    render(<CheckInPage />)
    await screen.findByText('Office')

    expect(toast.error).not.toHaveBeenCalled()
  })
})
