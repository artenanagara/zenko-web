import tailwindcss from '@tailwindcss/vite'
import packageMetadata from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  // Components are grouped into folders by domain (ui, layout, home, …) purely
  // for navigation. pathPrefix: false keeps the folder out of the tag name, so
  // it stays <AppButton>, not <UiAppButton> — moving a file between folders
  // must not be a breaking change for every call site.
  components: [{ path: '~/components', pathPrefix: false }],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    public: {
      // Application version maintained by Release Please from package.json.
      appVersion: packageMetadata.version,
      // Base URL of zenko-api. Override with NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:8080/api/v1',
      // Serve the catalogue from app/mocks instead of calling the API.
      // Off by default so a production build never ships fixtures; turn it on
      // with NUXT_PUBLIC_USE_MOCK=true while the backend is unavailable.
      useMock: false,
      // Whether checkout may call POST /orders. Off until zenko-api exposes it
      // and a payment gateway is wired up behind it; while off, the checkout
      // page says the payment is not connected instead of placing an order.
      // Turn on with NUXT_PUBLIC_PAYMENT_ENABLED=true.
      paymentEnabled: false,
      // Dev-only shortcut past the (still absent) payment gateway. Only has an
      // effect while paymentEnabled is also on: after POST /orders creates the
      // pending purchase, the checkout immediately calls zenko-api's stub
      // POST /orders/:invoice/pay and treats the package as owned. Requires the
      // backend running Postgres with its own stub enabled. Never in
      // production. Turn on with NUXT_PUBLIC_PAYMENT_STUB=true.
      paymentStub: false,
		// Recovery flows are live in zenko-api. Operators can still turn one off
		// explicitly during a partial rollback without hiding the others.
      //
      // Verification: POST /auth/email/verify and /auth/email/resend.
      // Turn on with NUXT_PUBLIC_EMAIL_VERIFICATION_ENABLED=true.
		emailVerificationEnabled: true,
      // Password reset: POST /auth/password/forgot and /auth/password/reset.
		// Turn on with NUXT_PUBLIC_PASSWORD_RESET_ENABLED=true.
		passwordResetEnabled: true,
      // Changing a password from inside the account: POST /auth/password/change.
      // Its own switch for the same reason as the two above — a signed-in change
      // and an emailed reset are different endpoints, and may land apart.
      // Turn on with NUXT_PUBLIC_PASSWORD_CHANGE_ENABLED=true.
		passwordChangeEnabled: true,
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'Zenko — Marketplace Try Out',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Zenko membantu kamu menemukan dan membeli paket try out SKD/CPNS, BUMN, SNBT, dan TKA dengan harga terjangkau.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@1,500;1,600&display=swap',
        },
      ],
    },
  },
})
