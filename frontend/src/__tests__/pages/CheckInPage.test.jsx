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

describe('Check-in page: choice cards', () => {
  it('shows the three status cards', async () => {
    nochNichtEingecheckt()
    render(<CheckInPage />)

    expect(await screen.findByText('Home Office')).toBeInTheDocument()
    expect(screen.getByText('Office')).toBeInTheDocument()
    expect(screen.getByText('Abwesend')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('lays the cards out in a grid that wraps responsively', async () => {
    nochNichtEingecheckt()
    const { container } = render(<CheckInPage />)
    await screen.findByText('Office')

    expect(container.querySelector('.checkin-page > .container')).not.toBeNull()
    expect(container.querySelectorAll('.container .card')).toHaveLength(3)
  })

  it('shows no note before checking in', async () => {
    nochNichtEingecheckt()
    render(<CheckInPage />)
    await screen.findByText('Office')

    expect(screen.queryByText(/bereits eingecheckt/)).toBeNull()
  })

  it('shows the check-in button only once a card is chosen', async () => {
    nochNichtEingecheckt()
    render(<CheckInPage />)
    await screen.findByText('Office')
    expect(screen.queryByRole('button', { name: 'Einchecken' })).toBeNull()

    await userEvent.click(screen.getByText('Office'))

    expect(screen.getByRole('button', { name: 'Einchecken' })).toBeEnabled()
  })
})

describe('Check-in page: checking in', () => {
  it('sends the chosen status and confirms', async () => {
    nochNichtEingecheckt()
    api.post.mockResolvedValue({ data: {} })
    render(<CheckInPage />)
    await screen.findByText('Office')

    await userEvent.click(screen.getByText('Abwesend'))
    await userEvent.click(screen.getByRole('button', { name: 'Einchecken' }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/CheckIn/set-status', { status: 'Abwesend' }))
    expect(toast.success).toHaveBeenCalledWith('Erfolgreich eingecheckt!')
  })

  it('shows the note after checking in and locks the choice', async () => {
    nochNichtEingecheckt()
    api.post.mockResolvedValue({ data: {} })
    render(<CheckInPage />)
    await screen.findByText('Office')

    await userEvent.click(screen.getByText('Office'))
    await userEvent.click(screen.getByRole('button', { name: 'Einchecken' }))

    expect(await screen.findByText('Du hast heute bereits eingecheckt.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Einchecken' })).toBeDisabled()
  })

  it('reports an error when saving and does not check in', async () => {
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

describe('Check-in page: already checked in', () => {
  it('shows the large note with the status message', async () => {
    bereitsEingecheckt()
    render(<CheckInPage />)

    const hinweis = await screen.findByRole('status')

    expect(hinweis).toHaveTextContent('Du hast heute bereits eingecheckt.')
    expect(hinweis).toHaveClass('checkin-note')
  })

  it('preselects today\'s status and locks the other cards', async () => {
    bereitsEingecheckt('HomeOffice')
    const { container } = render(<CheckInPage />)
    await screen.findByRole('status')

    expect(screen.getByRole('radio', { name: /Home Office/ })).toBeChecked()
    expect(container.querySelectorAll('.card.disabled')).toHaveLength(2)
    expect(container.querySelector('.card.active')).toHaveTextContent('Home Office')
  })

  it('disables the check-in button', async () => {
    bereitsEingecheckt('Office')
    render(<CheckInPage />)

    expect(await screen.findByRole('button', { name: 'Einchecken' })).toBeDisabled()
  })

  it('sends nothing when clicked anyway', async () => {
    bereitsEingecheckt('Office')
    render(<CheckInPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Einchecken' }))

    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('Check-in page: loading errors', () => {
  it('shows a message on a server error', async () => {
    api.get.mockRejectedValue({ response: { status: 500 } })
    render(<CheckInPage />)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Laden der Daten'))
  })

  it('does not treat 404 (no entry yet) as an error', async () => {
    nochNichtEingecheckt()
    render(<CheckInPage />)
    await screen.findByText('Office')

    expect(toast.error).not.toHaveBeenCalled()
  })
})
