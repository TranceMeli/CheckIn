import { describe, it, expect, vi, beforeEach } from 'vitest'
import { de } from '../../i18n/messages.de'
import { en } from '../../i18n/messages.en'
import {
  DEFAULT_LANGUAGE, STORAGE_KEY, isLanguage, label, localeOf, monthNames,
  readStoredLanguage, storeLanguage, translate, translateRich,
} from '../../i18n/i18n'

beforeEach(() => {
  window.localStorage.clear()
})

const platzhalter = (text) => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()

describe('Messages', () => {
  it('has the same keys in German and English', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort())
  })

  it('uses the same placeholders in both languages', () => {
    for (const key of Object.keys(de)) {
      expect(platzhalter(en[key]), key).toEqual(platzhalter(de[key]))
    }
  })

  it('has no empty texts', () => {
    for (const [key, text] of [...Object.entries(de), ...Object.entries(en)]) {
      expect(text.trim(), key).not.toBe('')
    }
  })
})

describe('translate', () => {
  it('returns the text of the chosen language', () => {
    expect(translate('de', 'nav.manage')).toBe('Verwalten')
    expect(translate('en', 'nav.manage')).toBe('Manage')
  })

  it('replaces placeholders', () => {
    expect(translate('de', 'period.weekLabel', { week: 47, von: '16.11.', bis: '22.11.' })).toBe('KW 47 · 16.11. – 22.11.')
    expect(translate('en', 'period.weekLabel', { week: 47, von: '16/11', bis: '22/11' })).toBe('CW 47 · 16/11 – 22/11')
  })

  it('leaves a placeholder alone when no value is given', () => {
    expect(translate('en', 'chart.meter.of')).toBe('of {target}% target')
  })

  it('formats percentages per language', () => {
    expect(translate('de', 'pct', { n: 58 })).toBe('58 %')
    expect(translate('en', 'pct', { n: 58 })).toBe('58%')
  })

  it('falls back to German for an unknown language', () => {
    expect(translate('fr', 'nav.manage')).toBe('Verwalten')
  })

  it('returns the key for an unknown key', () => {
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist')
  })
})

describe('translateRich', () => {
  it('puts elements between the text parts', () => {
    const marker = { element: true }
    const teile = translateRich('en', 'manage.existing', { day: 'Thu 05/11', status: marker })

    expect(teile).toEqual(['There is already an entry for ', 'Thu 05/11', ': ', marker, '.'])
  })

  it('works for texts without placeholders', () => {
    expect(translateRich('de', 'nav.manage')).toEqual(['Verwalten'])
  })
})

describe('label', () => {
  it('translates the German labels from the backend', () => {
    expect(label('en', 'Mo')).toBe('Mon')
    expect(label('en', 'Mär')).toBe('Mar')
    expect(label('en', 'Okt')).toBe('Oct')
    expect(label('en', 'Vertrieb')).toBe('Sales')
  })

  it('keeps German labels and unknown values unchanged', () => {
    expect(label('de', 'Mo')).toBe('Mo')
    expect(label('en', 'Unbekannte Abteilung')).toBe('Unbekannte Abteilung')
  })
})

describe('Language helpers', () => {
  it('knows two languages and German is the default', () => {
    expect(DEFAULT_LANGUAGE).toBe('de')
    expect(isLanguage('de')).toBe(true)
    expect(isLanguage('en')).toBe(true)
    expect(isLanguage('fr')).toBe(false)
    expect(isLanguage(null)).toBe(false)
  })

  it('has twelve month names per language', () => {
    expect(monthNames('de')).toHaveLength(12)
    expect(monthNames('en')).toHaveLength(12)
    expect(monthNames('de')[2]).toBe('März')
    expect(monthNames('en')[2]).toBe('March')
  })

  it('picks a locale per language', () => {
    expect(localeOf('de')).toBe('de-DE')
    expect(localeOf('en')).toBe('en-GB')
    expect(localeOf('fr')).toBe('de-DE')
  })
})

describe('Stored language', () => {
  it('defaults to German without a stored choice', () => {
    expect(readStoredLanguage()).toBe('de')
  })

  it('returns the stored choice', () => {
    storeLanguage('en')

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en')
    expect(readStoredLanguage()).toBe('en')
  })

  it('ignores an invalid stored value', () => {
    window.localStorage.setItem(STORAGE_KEY, 'klingon')

    expect(readStoredLanguage()).toBe('de')
  })

  it('works when the storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })

    expect(readStoredLanguage()).toBe('de')
    expect(() => storeLanguage('en')).not.toThrow()
  })
})
