import { describe, it, expect } from 'vitest'
import {
  JAHR, MONATE, PERIODEN, iso, addDays, mondayOf, fmt, isoWeek, clampToYear,
  zeitraum, verschiebe, verschiebungMoeglich,
} from '../../utils/zeitraum'
import { quote, ZIEL_QUOTE } from '../../components/chartConfig'

// Kalender 2026: 01.01. ist ein Donnerstag, 02.11. ein Montag, 05.11. ein Donnerstag
const d = (m, t, j = 2026) => new Date(j, m - 1, t)

describe('Constants', () => {
  it('knows twelve German month names and four periods', () => {
    expect(MONATE).toHaveLength(12)
    expect(MONATE[0]).toBe('Januar')
    expect(MONATE[2]).toBe('März')
    expect(PERIODEN.map(p => p.key)).toEqual(['week', 'month', 'quarter', 'year'])
  })

  it('limits the demo data to 2026', () => {
    expect(JAHR).toBe(2026)
  })
})

describe('Date helpers', () => {
  it('iso formats locally as yyyy-MM-dd with leading zeros', () => {
    expect(iso(d(1, 5))).toBe('2026-01-05')
    expect(iso(d(11, 30))).toBe('2026-11-30')
  })

  it('addDays calculates across month and year boundaries', () => {
    expect(iso(addDays(d(11, 30), 1))).toBe('2026-12-01')
    expect(iso(addDays(d(1, 1), -1))).toBe('2025-12-31')
    expect(iso(addDays(d(11, 5), 0))).toBe('2026-11-05')
  })

  it('mondayOf returns the Monday of the week, also for a Sunday', () => {
    expect(iso(mondayOf(d(11, 5)))).toBe('2026-11-02')  // Donnerstag
    expect(iso(mondayOf(d(11, 2)))).toBe('2026-11-02')  // Montag
    expect(iso(mondayOf(d(11, 8)))).toBe('2026-11-02')  // Sonntag gehört noch zur Woche davor
  })

  it('fmt shows day and month in German', () => {
    expect(fmt(d(11, 2))).toBe('02.11.')
  })

  it('isoWeek counts according to ISO 8601', () => {
    expect(isoWeek(d(1, 1))).toBe(1)
    expect(isoWeek(d(11, 2))).toBe(45)
    expect(isoWeek(d(11, 8))).toBe(45)
    expect(isoWeek(d(12, 31))).toBe(53) // 2026 hat 53 Kalenderwochen
  })

  it('clampToYear keeps dates in the demo year', () => {
    expect(iso(clampToYear(d(12, 31, 2025)))).toBe('2026-01-01')
    expect(iso(clampToYear(d(1, 2, 2027)))).toBe('2026-12-31')
    expect(iso(clampToYear(d(6, 15)))).toBe('2026-06-15')
  })
})

describe('zeitraum', () => {
  it('week: Monday to Sunday with calendar week in the label', () => {
    const z = zeitraum('week', d(11, 5))
    expect(iso(z.von)).toBe('2026-11-02')
    expect(iso(z.bis)).toBe('2026-11-08')
    expect(z.label).toBe('KW 45 · 02.11. – 08.11.')
  })

  it('month: first to last day', () => {
    const z = zeitraum('month', d(11, 15))
    expect(iso(z.von)).toBe('2026-11-01')
    expect(iso(z.bis)).toBe('2026-11-30')
    expect(z.label).toBe('November 2026')
  })

  it('month: knows February without a leap day', () => {
    expect(iso(zeitraum('month', d(2, 10)).bis)).toBe('2026-02-28')
  })

  it('quarter: three full months', () => {
    const q4 = zeitraum('quarter', d(11, 15))
    expect(iso(q4.von)).toBe('2026-10-01')
    expect(iso(q4.bis)).toBe('2026-12-31')
    expect(q4.label).toBe('Q4 2026')

    const q1 = zeitraum('quarter', d(2, 3))
    expect(iso(q1.von)).toBe('2026-01-01')
    expect(iso(q1.bis)).toBe('2026-03-31')
    expect(q1.label).toBe('Q1 2026')
  })

  it('year: always the complete demo year', () => {
    const z = zeitraum('year', d(6, 15))
    expect(iso(z.von)).toBe('2026-01-01')
    expect(iso(z.bis)).toBe('2026-12-31')
    expect(z.label).toBe('Jahr 2026')
  })
})

describe('verschiebe', () => {
  it('shifts week, month and quarter', () => {
    expect(iso(verschiebe('week', d(11, 5), 1))).toBe('2026-11-12')
    expect(iso(verschiebe('week', d(11, 5), -1))).toBe('2026-10-29')
    expect(iso(verschiebe('month', d(11, 15), 1))).toBe('2026-12-01')
    expect(iso(verschiebe('month', d(1, 15), -1))).toBe('2025-12-01')
    expect(iso(verschiebe('quarter', d(11, 15), -1))).toBe('2026-08-01')
  })

  it('leaves the year unchanged', () => {
    expect(iso(verschiebe('year', d(6, 15), 1))).toBe('2026-06-15')
  })
})

describe('verschiebungMoeglich', () => {
  it('allows months within the year but not across the year boundaries', () => {
    expect(verschiebungMoeglich('month', d(3, 10), -1)).toBe(true)
    expect(verschiebungMoeglich('month', d(3, 10), 1)).toBe(true)
    expect(verschiebungMoeglich('month', d(1, 10), -1)).toBe(false)
    expect(verschiebungMoeglich('month', d(12, 10), 1)).toBe(false)
  })

  it('allows quarters only within 2026', () => {
    expect(verschiebungMoeglich('quarter', d(11, 10), -1)).toBe(true)
    expect(verschiebungMoeglich('quarter', d(11, 10), 1)).toBe(false)
    expect(verschiebungMoeglich('quarter', d(2, 10), -1)).toBe(false)
  })

  it('blocks weeks that reach into the neighbouring year', () => {
    expect(verschiebungMoeglich('week', d(6, 10), 1)).toBe(true)
    expect(verschiebungMoeglich('week', d(1, 5), -1)).toBe(false)
    expect(verschiebungMoeglich('week', d(12, 28), 1)).toBe(false)
  })

  it('never allows moving on for the year', () => {
    expect(verschiebungMoeglich('year', d(6, 15), 1)).toBe(false)
    expect(verschiebungMoeglich('year', d(6, 15), -1)).toBe(false)
  })
})

describe('quote', () => {
  it('rounds to whole percent', () => {
    expect(quote(58, 100)).toBe(58)
    expect(quote(1, 3)).toBe(33)
    expect(quote(2, 3)).toBe(67)
  })

  it('returns 0 instead of NaN when nothing was recorded', () => {
    expect(quote(0, 0)).toBe(0)
    expect(quote(5, 0)).toBe(0)
  })

  it('the target is 60 percent', () => {
    expect(ZIEL_QUOTE).toBe(60)
  })
})
