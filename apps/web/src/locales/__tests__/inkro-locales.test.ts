import { describe, expect, it } from 'vitest'
import { createIntl } from 'react-intl'
import en from '../en.json'
import sk from '../sk.json'
import cs from '../cs.json'
import { portalStatusLabel } from '@/lib/shared/portal-status-label'

const parser = createIntl({ locale: 'en', messages: {} }).formatters
const parse = (message: string) => parser.getMessageFormat(message, 'en').getAst()

function variables(ast: ReturnType<typeof parse>, found = new Set<string>()): string[] {
  for (const node of ast) {
    // ICU AST type 0 is a literal; pound nodes have no value.
    if (node.type !== 0 && 'value' in node) found.add(node.value)
    if ('children' in node) variables(node.children, found)
    if ('options' in node) {
      for (const option of Object.values(node.options)) variables(option.value, found)
    }
  }
  return [...found].sort()
}

describe('Inkro complete catalogs', () => {
  for (const [locale, catalog] of Object.entries({ sk, cs })) {
    it(`${locale}: all messages parse and preserve ICU variables and rich-text tags`, () => {
      for (const [key, message] of Object.entries(catalog)) {
        expect(variables(parse(message)), key).toEqual(variables(parse(en[key as keyof typeof en])))
      }
    })

    it(`${locale}: renders counts, login and navigation`, () => {
      const intl = createIntl({
        locale,
        messages: catalog,
        onError: (error) => {
          throw error
        },
      })
      expect(intl.formatMessage({ id: 'portal.header.auth.logIn' })).toBe(
        locale === 'sk' ? 'Prihlásiť sa' : 'Přihlásit se'
      )
      expect(intl.formatMessage({ id: 'portal.header.nav.roadmap' })).toBe(
        locale === 'sk' ? 'Plán vývoja' : 'Plán vývoje'
      )
      const comments = (count: number) =>
        intl.formatMessage({ id: 'widget.postDetail.comments' }, { count })
      expect([comments(1), comments(2), comments(5)]).toEqual(
        locale === 'sk'
          ? ['1 komentár', '2 komentáre', '5 komentárov']
          : ['1 komentář', '2 komentáře', '5 komentářů']
      )
    })
  }

  it('localizes shipped statuses without modifying custom statuses', () => {
    expect(portalStatusLabel('Under Review', 'sk')).toBe('Posudzujeme')
    expect(portalStatusLabel('Planned', 'cs')).toBe('Plánováno')
    expect(portalStatusLabel('Planned', 'en')).toBe('Planned')
    expect(portalStatusLabel('Waiting for customer', 'sk')).toBe('Waiting for customer')
  })
})
