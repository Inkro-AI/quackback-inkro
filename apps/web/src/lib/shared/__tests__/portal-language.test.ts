import { describe, expect, it } from 'vitest'
import {
  portalLanguageCookie,
  readPortalLanguagePreference,
  resolvePortalLanguage,
} from '../portal-language'

describe('Inkro portal language', () => {
  it.each([
    ['sk-SK,sk;q=0.9,en;q=0.8', 'sk'],
    ['cs-CZ,cs;q=0.9,en;q=0.8', 'cs'],
    ['en-GB,en;q=0.9', 'en'],
    ['de-DE,cs-CZ;q=0.8,sk;q=0.6', 'cs'],
    ['sk;q=0,cs;q=0.5', 'cs'],
    ['sk;q=0.2,en;q=0.9', 'en'],
    ['de,fr', 'en'],
    [null, 'en'],
  ])('detects %s as %s', (header, expected) => {
    expect(resolvePortalLanguage(header)).toBe(expected)
  })

  it('uses an explicit choice even after the browser language changes', () => {
    const cookie = portalLanguageCookie('cs', true)
    expect(resolvePortalLanguage('sk-SK', cookie)).toBe('cs')
    expect(resolvePortalLanguage('en-US', `session=x; ${cookie}`)).toBe('cs')
  })

  it('returns to automatic detection when the choice is cleared', () => {
    const cookie = portalLanguageCookie('auto', true)
    expect(cookie).toContain('Max-Age=0')
    expect(readPortalLanguagePreference(cookie)).toBe('auto')
    expect(resolvePortalLanguage('sk-SK', cookie)).toBe('sk')
  })

  it.each(['inkro_portal_language=de', 'inkro_portal_language=%zz', 'x_inkro_portal_language=cs'])(
    'ignores malformed or unsupported cookies: %s',
    (cookie) => {
      expect(resolvePortalLanguage('sk', cookie)).toBe('sk')
    }
  )

  it('keeps the preference host-only, one year, and secure on HTTPS', () => {
    expect(portalLanguageCookie('sk', true)).toBe(
      'inkro_portal_language=sk; Path=/; Max-Age=31536000; SameSite=Lax; Secure'
    )
    expect(portalLanguageCookie('sk', false)).not.toContain('Secure')
    expect(portalLanguageCookie('sk', true)).not.toContain('Domain=')
  })
})
