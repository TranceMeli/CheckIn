import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import {
  TargetMeter, OfficeRanking, TeamWeekGrid, YearHeatmap,
  WeekdayChart, DepartmentShareChart, AbsenceChart, StatusDonut,
} from '../../components/DashboardCharts'

describe('TargetMeter (Ziel-Quote)', () => {
  it('zeigt die Quote und sagt, wie weit das Ziel entfernt ist', () => {
    render(<TargetMeter office={58} total={100} />)

    expect(screen.getByText(/58 %/)).toBeInTheDocument()
    expect(screen.getByText('2 Prozentpunkte unter dem Ziel.')).toBeInTheDocument()
  })

  it('meldet erreichtes Ziel', () => {
    render(<TargetMeter office={60} total={100} />)

    expect(screen.getByText('Das Ziel ist erreicht.')).toBeInTheDocument()
  })

  it('meldet auch übererfülltes Ziel als erreicht', () => {
    render(<TargetMeter office={9} total={10} />)

    expect(screen.getByText('Das Ziel ist erreicht.')).toBeInTheDocument()
  })

  it('sagt ehrlich, wenn nichts erfasst wurde', () => {
    render(<TargetMeter office={0} total={0} />)

    expect(screen.getByText('Keine Check-ins im Zeitraum.')).toBeInTheDocument()
    expect(screen.queryByText(/Prozentpunkte/)).toBeNull()
  })

  it('beschreibt den Balken für Screenreader', () => {
    render(<TargetMeter office={58} total={100} />)

    expect(screen.getByRole('img', { name: 'Office-Quote 58 Prozent, Ziel 60 Prozent' })).toBeInTheDocument()
  })

  it('begrenzt die Balkenbreite auf die Quote', () => {
    const { container } = render(<TargetMeter office={25} total={100} />)

    expect(container.querySelector('.meter i').style.width).toBe('25%')
    expect(container.querySelector('.meter u').style.left).toBe('60%')
  })
})

describe('OfficeRanking', () => {
  const daten = [
    { userId: 'a', name: 'Anna Adler', abteilung: 'Alpha', office: 10 },
    { userId: 'b', name: 'Ben Berg', abteilung: 'Beta', office: 5 },
  ]

  it('listet die Personen mit Position, Abteilung und Tagen', () => {
    render(<OfficeRanking data={daten} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('1.')).toBeInTheDocument()
    expect(within(items[0]).getByText('Anna Adler')).toBeInTheDocument()
    expect(within(items[0]).getByText('Alpha')).toBeInTheDocument()
    expect(within(items[0]).getByText('10')).toBeInTheDocument()
    expect(within(items[1]).getByText('2.')).toBeInTheDocument()
  })

  it('skaliert die Balken relativ zum Spitzenreiter', () => {
    const { container } = render(<OfficeRanking data={daten} />)

    const balken = container.querySelectorAll('.ranking__bar i')
    expect(balken[0].style.width).toBe('100%')
    expect(balken[1].style.width).toBe('50%')
  })

  it('zeigt einen Leerzustand ohne Daten', () => {
    render(<OfficeRanking data={[]} />)

    expect(screen.getByText('Keine Daten für diesen Zeitraum')).toBeInTheDocument()
  })
})

describe('TeamWeekGrid (Wochenraster)', () => {
  const tage = ['Mo 02.', 'Di 03.', 'Mi 04.', 'Do 05.', 'Fr 06.']
  const daten = [
    { userId: 'a', name: 'Anna Adler', abteilung: 'Alpha', tage: ['Office', 'HomeOffice', 'Abwesend', null, null] },
  ]

  it('zeigt Wochentage, Namen und Abteilung', () => {
    render(<TeamWeekGrid data={daten} tage={tage} />)

    tage.forEach(t => expect(screen.getByText(t)).toBeInTheDocument())
    expect(screen.getByText('Anna Adler')).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  it('übersetzt die Status in kurze Beschriftungen und markiert fehlende Tage', () => {
    render(<TeamWeekGrid data={daten} tage={tage} />)

    expect(screen.getByText('Office')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Abw.')).toBeInTheDocument()
    expect(screen.getAllByText('–')).toHaveLength(2)
  })

  it('färbt die Zellen je Status', () => {
    const { container } = render(<TeamWeekGrid data={daten} tage={tage} />)

    expect(container.querySelector('.week-grid__cell--office')).toHaveTextContent('Office')
    expect(container.querySelector('.week-grid__cell--homeoffice')).toHaveTextContent('Home')
    expect(container.querySelector('.week-grid__cell--abwesend')).toHaveTextContent('Abw.')
    expect(container.querySelectorAll('.week-grid__cell--leer')).toHaveLength(2)
  })

  it('zeigt einen Leerzustand ohne Mitarbeiter', () => {
    render(<TeamWeekGrid data={[]} tage={tage} />)

    expect(screen.getByText('Keine Mitarbeiter in dieser Abteilung')).toBeInTheDocument()
  })
})

describe('YearHeatmap', () => {
  const wochen = Array.from({ length: 52 }, (_, i) => ({ woche: i + 1, total: 0, office: 0 }))
  wochen[0] = { woche: 1, total: 4, office: 2 }
  wochen[44] = { woche: 45, total: 8, office: 8 }

  it('zeichnet eine Zelle pro Kalenderwoche', () => {
    const { container } = render(<YearHeatmap data={wochen} />)

    expect(container.querySelectorAll('.heatmap i')).toHaveLength(52)
  })

  it('nennt den Office-Anteil im Tooltip jeder Zelle', () => {
    const { container } = render(<YearHeatmap data={wochen} />)

    expect(container.querySelector('[title="KW 1: 50 % Office"]')).not.toBeNull()
    expect(container.querySelector('[title="KW 45: 100 % Office"]')).not.toBeNull()
  })

  it('kennzeichnet Wochen ohne Daten', () => {
    const { container } = render(<YearHeatmap data={wochen} />)

    expect(container.querySelector('[title="KW 2: keine Daten"]')).not.toBeNull()
  })

  it('färbt Wochen mit mehr Office dunkler als Wochen mit weniger', () => {
    const { container } = render(<YearHeatmap data={wochen} />)

    // jsdom rechnet hsl() teils in rgb() um: je dunkler die Zelle, desto kleiner die Helligkeit
    const helligkeit = (title) => {
      const el = container.querySelector(`[title="${title}"]`)
      const rgb = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(el.style.background)
      if (rgb) return (Number(rgb[1]) + Number(rgb[2]) + Number(rgb[3])) / 3
      return Number(/(\d+)%\)$/.exec(el.style.background)[1])
    }
    expect(helligkeit('KW 45: 100 % Office')).toBeLessThan(helligkeit('KW 1: 50 % Office'))
  })

  it('beschreibt die Grafik für Screenreader und zeigt die Legende', () => {
    render(<YearHeatmap data={wochen} />)

    expect(screen.getByRole('img', { name: /Office-Anteil pro Kalenderwoche/ })).toBeInTheDocument()
    expect(screen.getByText('wenig Office')).toBeInTheDocument()
    expect(screen.getByText('viel Office')).toBeInTheDocument()
  })
})

describe('Leerzustände der Diagramme', () => {
  const leer = { label: 'Mo', office: 0, homeOffice: 0, abwesend: 0, total: 0 }

  it('WeekdayChart ohne Daten', () => {
    render(<WeekdayChart data={[leer, leer]} />)

    expect(screen.getByText('Keine Daten für diesen Zeitraum')).toBeInTheDocument()
  })

  it('DepartmentShareChart ohne Abteilungen', () => {
    render(<DepartmentShareChart data={[]} />)

    expect(screen.getByText('Keine Daten für diesen Zeitraum')).toBeInTheDocument()
  })

  it('AbsenceChart ohne Abwesenheiten', () => {
    render(<AbsenceChart data={[{ ...leer, label: 'Alpha' }]} />)

    expect(screen.getByText('Keine Abwesenheiten im Zeitraum')).toBeInTheDocument()
  })

  it('StatusDonut ohne Einträge', () => {
    render(<StatusDonut data={{ office: 0, homeOffice: 0, abwesend: 0 }} />)

    expect(screen.getByText('Keine Daten für diesen Zeitraum')).toBeInTheDocument()
  })
})
