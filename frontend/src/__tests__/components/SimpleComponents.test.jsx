import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import StatCard from '../../components/StatCard'
import Karte from '../../components/Karte'
import Footer from '../../components/Footer'
import Button from '../../components/Button'
import PeriodBar from '../../components/PeriodBar'

describe('StatCard', () => {
  it('shows label and value', () => {
    render(<StatCard label="Office-Quote" value="58 %" />)

    expect(screen.getByText('Office-Quote')).toBeInTheDocument()
    expect(screen.getByText('58 %')).toBeInTheDocument()
  })

  it('shows the icon as decoration (aria-hidden) next to the text', () => {
    const { container } = render(
      <StatCard label="Office" value={8} icon={<svg data-testid="icon" />} />,
    )

    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(container.querySelector('.stats-card-icon')).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders no empty icon circle without an icon', () => {
    const { container } = render(<StatCard label="Gesamt" value={168} />)

    expect(container.querySelector('.stats-card-icon')).toBeNull()
  })

  it('passes the card colour as a CSS variable', () => {
    const { container } = render(<StatCard label="Abwesend" value={1} color="#EF4444" />)

    expect(container.querySelector('.stats-card').style.getPropertyValue('--card-color')).toBe('#EF4444')
  })

  it('shows the number 0 instead of hiding it', () => {
    render(<StatCard label="Abwesend" value={0} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

describe('Karte', () => {
  it('shows title, badge and content', () => {
    render(<Karte titel="Ziel-Quote" hinweis="November 2026"><p>Inhalt</p></Karte>)

    expect(screen.getByRole('heading', { name: /Ziel-Quote/ })).toBeInTheDocument()
    expect(screen.getByText('November 2026')).toBeInTheDocument()
    expect(screen.getByText('Inhalt')).toBeInTheDocument()
  })

  it('omits the badge when no hint is passed', () => {
    const { container } = render(<Karte titel="Ohne Hinweis"><span /></Karte>)

    expect(container.querySelector('.chart-box__hint')).toBeNull()
  })

  it('appends additional classes', () => {
    const { container } = render(<Karte titel="Breit" className="chart-box--full"><span /></Karte>)

    expect(container.firstChild).toHaveClass('chart-box', 'chart-box--full')
  })
})

describe('Footer', () => {
  it('links the imprint and the privacy policy', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum')
    expect(screen.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute('href', '/datenschutz')
  })

  it('marks the project as fictional', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)

    expect(screen.getByText(/fiktives Demoprojekt/)).toBeInTheDocument()
  })

  it('takes a custom class for the login and legal pages', () => {
    const { container } = render(<MemoryRouter><Footer className="login-footer" /></MemoryRouter>)

    expect(container.querySelector('footer')).toHaveClass('login-footer')
  })
})

describe('Button', () => {
  it('calls onClick', async () => {
    const onClick = vi.fn()
    render(<Button label="Einchecken" onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: 'Einchecken' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does nothing when disabled', async () => {
    const onClick = vi.fn()
    render(<Button label="Einchecken" onClick={onClick} disabled />)

    await userEvent.click(screen.getByRole('button', { name: 'Einchecken' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('PeriodBar', () => {
  const anker = new Date(2026, 5, 15) // Juni 2026: in beide Richtungen verschiebbar

  const renderBar = (props = {}) => {
    const handlers = { onPeriode: vi.fn(), onAnker: vi.fn() }
    render(<PeriodBar periode="month" anker={anker} label="Juni 2026" {...handlers} {...props} />)
    return handlers
  }

  it('shows four periods and marks the active one', () => {
    renderBar()

    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Monat' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Woche' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Juni 2026')).toBeInTheDocument()
  })

  it('reports the choice of another period', async () => {
    const { onPeriode } = renderBar()

    await userEvent.click(screen.getByRole('button', { name: 'Quartal' }))

    expect(onPeriode).toHaveBeenCalledWith('quarter')
  })

  it('steps one month forward and back with the arrows', async () => {
    const { onAnker } = renderBar()

    await userEvent.click(screen.getByRole('button', { name: 'Nächster Zeitraum' }))
    await userEvent.click(screen.getByRole('button', { name: 'Voriger Zeitraum' }))

    expect(onAnker.mock.calls[0][0]).toEqual(new Date(2026, 6, 1))
    expect(onAnker.mock.calls[1][0]).toEqual(new Date(2026, 4, 1))
  })

  it('disables the back arrow in January and the forward arrow in December', () => {
    const { unmount } = render(
      <PeriodBar periode="month" anker={new Date(2026, 0, 10)} label="Januar 2026" onPeriode={() => {}} onAnker={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Voriger Zeitraum' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nächster Zeitraum' })).toBeEnabled()
    unmount()

    render(
      <PeriodBar periode="month" anker={new Date(2026, 11, 10)} label="Dezember 2026" onPeriode={() => {}} onAnker={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Nächster Zeitraum' })).toBeDisabled()
  })

  it('disables both arrows for the year', () => {
    renderBar({ periode: 'year', label: 'Jahr 2026' })

    expect(screen.getByRole('button', { name: 'Voriger Zeitraum' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nächster Zeitraum' })).toBeDisabled()
  })
})
