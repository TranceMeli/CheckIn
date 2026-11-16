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
  it('zeigt Beschriftung und Wert', () => {
    render(<StatCard label="Office-Quote" value="58 %" />)

    expect(screen.getByText('Office-Quote')).toBeInTheDocument()
    expect(screen.getByText('58 %')).toBeInTheDocument()
  })

  it('zeigt das Icon dekorativ (aria-hidden) neben dem Text', () => {
    const { container } = render(
      <StatCard label="Office" value={8} icon={<svg data-testid="icon" />} />,
    )

    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(container.querySelector('.stats-card-icon')).toHaveAttribute('aria-hidden', 'true')
  })

  it('rendert ohne Icon keinen leeren Icon-Kreis', () => {
    const { container } = render(<StatCard label="Gesamt" value={168} />)

    expect(container.querySelector('.stats-card-icon')).toBeNull()
  })

  it('übergibt die Kartenfarbe als CSS-Variable', () => {
    const { container } = render(<StatCard label="Abwesend" value={1} color="#EF4444" />)

    expect(container.querySelector('.stats-card').style.getPropertyValue('--card-color')).toBe('#EF4444')
  })

  it('zeigt die Zahl 0 an, statt sie zu verstecken', () => {
    render(<StatCard label="Abwesend" value={0} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

describe('Karte', () => {
  it('zeigt Titel, Plakette und Inhalt', () => {
    render(<Karte titel="Ziel-Quote" hinweis="November 2026"><p>Inhalt</p></Karte>)

    expect(screen.getByRole('heading', { name: /Ziel-Quote/ })).toBeInTheDocument()
    expect(screen.getByText('November 2026')).toBeInTheDocument()
    expect(screen.getByText('Inhalt')).toBeInTheDocument()
  })

  it('lässt die Plakette weg, wenn kein Hinweis übergeben wird', () => {
    const { container } = render(<Karte titel="Ohne Hinweis"><span /></Karte>)

    expect(container.querySelector('.chart-box__hint')).toBeNull()
  })

  it('hängt zusätzliche Klassen an', () => {
    const { container } = render(<Karte titel="Breit" className="chart-box--full"><span /></Karte>)

    expect(container.firstChild).toHaveClass('chart-box', 'chart-box--full')
  })
})

describe('Footer', () => {
  it('verlinkt Impressum und Datenschutz', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum')
    expect(screen.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute('href', '/datenschutz')
  })

  it('kennzeichnet das Projekt als fiktiv', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)

    expect(screen.getByText(/fiktives Demoprojekt/)).toBeInTheDocument()
  })

  it('übernimmt eine eigene Klasse für die Login- und Rechtsseiten', () => {
    const { container } = render(<MemoryRouter><Footer className="login-footer" /></MemoryRouter>)

    expect(container.querySelector('footer')).toHaveClass('login-footer')
  })
})

describe('Button', () => {
  it('ruft onClick auf', async () => {
    const onClick = vi.fn()
    render(<Button label="Einchecken" onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: 'Einchecken' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('löst im deaktivierten Zustand nichts aus', async () => {
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

  it('zeigt vier Zeiträume und markiert den aktiven', () => {
    renderBar()

    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Monat' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Woche' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Juni 2026')).toBeInTheDocument()
  })

  it('meldet die Wahl eines anderen Zeitraums', async () => {
    const { onPeriode } = renderBar()

    await userEvent.click(screen.getByRole('button', { name: 'Quartal' }))

    expect(onPeriode).toHaveBeenCalledWith('quarter')
  })

  it('schaltet mit den Pfeilen einen Monat vor und zurück', async () => {
    const { onAnker } = renderBar()

    await userEvent.click(screen.getByRole('button', { name: 'Nächster Zeitraum' }))
    await userEvent.click(screen.getByRole('button', { name: 'Voriger Zeitraum' }))

    expect(onAnker.mock.calls[0][0]).toEqual(new Date(2026, 6, 1))
    expect(onAnker.mock.calls[1][0]).toEqual(new Date(2026, 4, 1))
  })

  it('sperrt den Zurück-Pfeil im Januar und den Weiter-Pfeil im Dezember', () => {
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

  it('sperrt beide Pfeile beim Jahr', () => {
    renderBar({ periode: 'year', label: 'Jahr 2026' })

    expect(screen.getByRole('button', { name: 'Voriger Zeitraum' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nächster Zeitraum' })).toBeDisabled()
  })
})
