// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { useState } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { useIntl } from 'react-intl'
import { PortalLanguageSelector } from '../portal-language-selector'
import { PortalIntlProvider } from '@/components/portal-intl-provider'
import { loadPortalMessages, type SupportedLocale } from '@/lib/shared/i18n'
import {
  portalLanguageCookie,
  readPortalLanguagePreference,
  resolvePortalLanguage,
  type PortalLanguagePreference,
} from '@/lib/shared/portal-language'
import {
  createRouteContextMemo,
  expireRouteContextOnInvalidate,
} from '@/lib/client/route-context-memo'

afterEach(() => {
  cleanup()
  document.cookie = portalLanguageCookie('auto', false)
})

function FeedbackDraft() {
  const [draft, setDraft] = useState('')
  const intl = useIntl()
  return (
    <>
      <h1>{intl.formatMessage({ id: 'portal.header.nav.roadmap', defaultMessage: 'Roadmap' })}</h1>
      <textarea
        aria-label="Draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </>
  )
}

async function mount() {
  type Context = {
    locale: SupportedLocale
    portalLanguagePreference: PortalLanguagePreference
    messages: Record<string, string>
  }
  const memo = createRouteContextMemo<Context>()
  const root = createRootRouteWithContext<object>()({
    beforeLoad: () =>
      memo.get(async () => {
        const locale = resolvePortalLanguage('sk-SK,en;q=0.8', document.cookie)
        return {
          locale,
          portalLanguagePreference: readPortalLanguagePreference(document.cookie),
          messages: await loadPortalMessages(locale),
        }
      }),
    component: function Shell() {
      const { locale, messages } = root.useRouteContext() as unknown as Context
      return (
        <PortalIntlProvider locale={locale} messages={messages}>
          <PortalLanguageSelector />
          <Outlet />
        </PortalIntlProvider>
      )
    },
  })
  const home = createRoute({ getParentRoute: () => root, path: '/', component: FeedbackDraft })
  const router = createRouter({
    routeTree: root.addChildren([home]),
    history: createMemoryHistory(),
    context: {},
  })
  expireRouteContextOnInvalidate(router)
  await act(async () => {
    render(<RouterProvider router={router} />)
  })
  await screen.findByRole('button', { name: /^(Jazyk|Language)$/ })
  return router
}

async function chooseLanguage(name: string) {
  const trigger = screen.getByRole('button', { name: /^(Jazyk|Language)$/ })
  await waitFor(() => expect(trigger).not.toBeDisabled())
  fireEvent.click(trigger)
  fireEvent.click(await screen.findByRole('menuitem', { name }))
}

describe('portal language selection', () => {
  it('detects the browser language, switches without losing a draft, remembers choice, and returns to automatic', async () => {
    await mount()
    await screen.findByRole('heading', { name: 'Plán vývoja' })
    const draft = screen.getByRole('textbox') as HTMLTextAreaElement
    fireEvent.change(draft, { target: { value: 'Môj rozpísaný nápad' } })
    await chooseLanguage('Čeština')
    await screen.findByRole('heading', { name: 'Plán vývoje' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Jazyk' })).not.toBeDisabled())
    expect(draft.value).toBe('Môj rozpísaný nápad')
    expect(screen.getByRole('textbox')).toBe(draft)
    expect(readPortalLanguagePreference(document.cookie)).toBe('cs')

    cleanup()
    await mount()
    await screen.findByRole('heading', { name: 'Plán vývoje' })
    fireEvent.click(screen.getByRole('button', { name: 'Jazyk' }))
    expect(await screen.findByRole('menuitem', { name: 'Čeština' })).toHaveAttribute(
      'aria-current',
      'true'
    )
    fireEvent.click(screen.getByRole('menuitem', { name: 'English' }))
    await screen.findByRole('heading', { name: 'Roadmap' })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Language' })).not.toBeDisabled())
    await chooseLanguage('Automatic')
    await screen.findByRole('heading', { name: 'Plán vývoja' })
    expect(readPortalLanguagePreference(document.cookie)).toBe('auto')
  })
})
