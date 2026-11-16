import { describe, it, expect } from 'vitest'
import {
  JAHR, MONATE, PERIODEN, iso, addDays, mondayOf, fmt, isoWeek, clampToYear,
  zeitraum, verschiebe, verschiebungMoeglich,
} from '../../utils/zeitraum'
import { quote, ZIEL_QUOTE } from '../../components/chartConfig'

// Kalender 2026: 01.01. ist ein Donnerstag, 02.11. ein Montag, 05.11. ein Donnerstag
const d = (m, t, j = 2026) => new Date(j, m - 1, t)

describe('Konstanten', () => {
  it('kennt zwölf deutsche Monatsnamen und vier Zeiträume', () => {
    expect(MONATE).toHaveLength(12)
    expect(MONATE[0]).toBe('Januar')
    expect(MONATE[2]).toBe('März')
    expect(PERIODEN.map(p => p.key)).toEqual(['week', 'month', 'quarter', 'year'])
  })

  it('beschränkt die Demodaten auf 2026', () => {
    expect(JAHR).toBe(2026)
  })
})

describe('Datumshelfer', () => {
  it('iso formatiert lokal als yyyy-MM-dd mit führenden Nullen', () => {
    expect(iso(d(1, 5))).toBe('2026-01-05')
    expect(iso(d(11, 30))).toBe('2026-11-30')
  })

  it('addDays rechnet über Monats- und Jahresgrenzen', () => {
    expect(iso(addDays(d(11, 30), 1))).toBe('2026-12-01')
    expect(iso(addDays(d(1, 1), -1))).toBe('2025-12-31')
    expect(iso(addDays(d(11, 5), 0))).toBe('2026-11-05')
  })

  it('mondayOf liefert den Montag der Woche, auch für einen Sonntag', () => {
    expect(iso(mondayOf(d(11, 5)))).toBe('2026-11-02')  // Donnerstag
    expect(iso(mondayOf(d(11, 2)))).toBe('2026-11-02')  // Montag
    expect(iso(mondayOf(d(11, 8)))).toBe('2026-11-02')  // Sonntag gehört noch zur Woche davor
  })

  it('fmt zeigt Tag und Monat deutsch', () => {
    expect(fmt(d(11, 2))).toBe('02.11.')
  })

  it('isoWeek zählt nach ISO 8601', () => {
    expect(isoWeek(d(1, 1))).toBe(1)
    expect(isoWeek(d(11, 2))).toBe(45)
    expect(isoWeek(d(11, 8))).toBe(45)
    expect(isoWeek(d(12, 31))).toBe(53) // 2026 hat 53 Kalenderwochen
  })

  it('clampToYear hält Daten im Demo-Jahr', () => {
    expect(iso(clampToYear(d(12, 31, 2025)))).toBe('2026-01-01')
    expect(iso(clampToYear(d(1, 2, 2027)))).toBe('2026-12-31')
    expect(iso(clampToYear(d(6, 15)))).toBe('2026-06-15')
  })
})

describe('zeitraum', () => {
  it('Woche: Montag bis Sonntag mit Kalenderwoche im Label', () => {
    const z = zeitraum('week', d(11, 5))
    expect(iso(z.von)).toBe('2026-11-02')
    expect(iso(z.bis)).toBe('2026-11-08')
    expect(z.label).toBe('KW 45 · 02.11. – 08.11.')
  })

  it('Monat: erster bis letzter Tag', () => {
    const z = zeitraum('month', d(11, 15))
    expect(iso(z.von)).toBe('2026-11-01')
    expect(iso(z.bis)).toBe('2026-11-30')
    expect(z.label).toBe('November 2026')
  })

  it('Monat: kennt den Schalttag-freien Februar', () => {
    expect(iso(zeitraum('month', d(2, 10)).bis)).toBe('2026-02-28')
  })

  it('Quartal: drei volle Monate', () => {
    const q4 = zeitraum('quarter', d(11, 15))
    expect(iso(q4.von)).toBe('2026-10-01')
    expect(iso(q4.bis)).toBe('2026-12-31')
    expect(q4.label).toBe('Q4 2026')

    const q1 = zeitraum('quarter', d(2, 3))
    expect(iso(q1.von)).toBe('2026-01-01')
    expect(iso(q1.bis)).toBe('2026-03-31')
    expect(q1.label).toBe('Q1 2026')
  })

  it('Jahr: immer das komplette Demo-Jahr', () => {
    const z = zeitraum('year', d(6, 15))
    expect(iso(z.von)).toBe('2026-01-01')
    expect(iso(z.bis)).toBe('2026-12-31')
    expect(z.label).toBe('Jahr 2026')
  })
})

describe('verschiebe', () => {
  it('verschiebt Woche, Monat und Quartal', () => {
    expect(iso(verschiebe('week', d(11, 5), 1))).toBe('2026-11-12')
    expect(iso(verschiebe('week', d(11, 5), -1))).toBe('2026-10-29')
    expect(iso(verschiebe('month', d(11, 15), 1))).toBe('2026-12-01')
    expect(iso(verschiebe('month', d(1, 15), -1))).toBe('2025-12-01')
    expect(iso(verschiebe('quarter', d(11, 15), -1))).toBe('2026-08-01')
  })

  it('lässt das Jahr unverändert', () => {
    expect(iso(verschiebe('year', d(6, 15), 1))).toBe('2026-06-15')
  })
})

describe('verschiebungMoeglich', () => {
  it('erlaubt Monate innerhalb des Jahres, aber nicht über die Jahresgrenzen', () => {
    expect(verschiebungMoeglich('month', d(3, 10), -1)).toBe(true)
    expect(verschiebungMoeglich('month', d(3, 10), 1)).toBe(true)
    expect(verschiebungMoeglich('month', d(1, 10), -1)).toBe(false)
    expect(verschiebungMoeglich('month', d(12, 10), 1)).toBe(false)
  })

  it('erlaubt Quartale nur innerhalb von 2026', () => {
    expect(verschiebungMoeglich('quarter', d(11, 10), -1)).toBe(true)
    expect(verschiebungMoeglich('quarter', d(11, 10), 1)).toBe(false)
    expect(verschiebungMoeglich('quarter', d(2, 10), -1)).toBe(false)
  })

  it('sperrt Wochen, die ins Nachbarjahr reichen', () => {
    expect(verschiebungMoeglich('week', d(6, 10), 1)).toBe(true)
    expect(verschiebungMoeglich('week', d(1, 5), -1)).toBe(false)
    expect(verschiebungMoeglich('week', d(12, 28), 1)).toBe(false)
  })

  it('erlaubt beim Jahr nie ein Weiterschalten', () => {
    expect(verschiebungMoeglich('year', d(6, 15), 1)).toBe(false)
    expect(verschiebungMoeglich('year', d(6, 15), -1)).toBe(false)
  })
})

describe('quote', () => {
  it('rundet auf ganze Prozent', () => {
    expect(quote(58, 100)).toBe(58)
    expect(quote(1, 3)).toBe(33)
    expect(quote(2, 3)).toBe(67)
  })

  it('liefert 0 statt NaN, wenn nichts erfasst wurde', () => {
    expect(quote(0, 0)).toBe(0)
    expect(quote(5, 0)).toBe(0)
  })

  it('das Ziel liegt bei 60 Prozent', () => {
    expect(ZIEL_QUOTE).toBe(60)
  })
})
