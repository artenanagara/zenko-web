import tailwindcss from '@tailwindcss/vite'
import packageMetadata from './package.json'

// Nuxt resolves relative `components[].path` entries against `srcDir`
// (`<root>/app` by default in Nuxt 4), not the project root — a plain
// './node_modules/...' string silently resolves to a nonexistent
// `app/node_modules/...` and the scanner finds nothing. Resolve explicitly
// from this config file's own location instead. Using `URL.pathname`
// directly (no `node:url` import) avoids needing @types/node, which this
// project doesn't otherwise depend on.
const designSystemComponentsDir = (subpath: string) =>
  new URL(`./node_modules/@artenanagara/zenko-design-system/app/components/${subpath}`, import.meta.url).pathname

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  typescript: {
    tsConfig: {
      compilerOptions: {
        noUnusedLocals: true,
        noUnusedParameters: true,
      },
    },
  },

  modules: ['@nuxtjs/sitemap'],

  site: {
    url: 'https://zenkoedu.id',
  },

  // Static routes are auto-discovered from Nuxt's resolved page routes
  // (already reflecting each page's `definePageMeta({ path })` override).
  // Dynamic /paket/:slug entries come from server/api/__sitemap__/urls.ts.
  // Everything below is either private/functional or already `noindex`
  // (packages/sample.vue), so it must not appear in the sitemap even though
  // it isn't all literally listed in public/robots.txt.
  sitemap: {
    exclude: [
      '/dashboard/**',
      '/akun/**',
      '/masuk',
      '/daftar',
      '/lupa-password',
      '/password-baru',
      '/verifikasi-email',
      '/checkout/**',
      '/pembayaran/**',
      '/paket/*/coba',
    ],
  },

  // Session cookies belong to zenko-api's origin, so Nuxt cannot resolve
  // these protected screens during SSR. Serving them as an SPA route avoids
  // rendering an account/dashboard layout that the client auth middleware
  // immediately replaces with /masuk or another role home.
  routeRules: {
    '/akun': { ssr: false },
    '/akun/**': { ssr: false },
    '/dashboard': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/pembayaran': { ssr: false },
    '/pembayaran/**': { ssr: false },
  },

  css: ['~/assets/css/main.css'],

  // Components are grouped into folders by domain (ui, layout, home, …) purely
  // for navigation. pathPrefix: false keeps the folder out of the tag name, so
  // it stays <AppButton>, not <UiAppButton> — moving a file between folders
  // must not be a breaking change for every call site.
  //
  // The @artenanagara/zenko-design-system entries come first so `~/components` registers
  // last and wins any name collision (this app already hand-rolls its own
  // AppSelect/AppCalendar/AppIcon/etc. — those must keep resolving to the
  // local, marketplace-tuned version, not the design system's generic one).
  // Listing the design system's own dirs here also resolves the internal
  // cross-references its components make to each other (e.g. AppButton uses
  // <AppIcon> without its own explicit import, relying on the same
  // Nuxt-auto-import convention this app already uses).
  components: [
    {
      path: designSystemComponentsDir('core'),
      pathPrefix: false,
      // These 12 names already exist as marketplace-tuned local components
      // (different prop shapes in some cases, e.g. AppButton's variant enum)
      // — excluding them here (rather than letting them lose a same-name
      // registration race) keeps the console warning-free and makes the
      // "local always wins" rule explicit instead of implicit in ordering.
      ignore: [
        '**/AppButton.vue', '**/AppCalendar.vue', '**/AppDateTimePicker.vue', '**/AppDropdownMenu.vue',
        '**/AppIcon.vue', '**/AppRange.vue', '**/AppSelect.vue', '**/AppTimePicker.vue',
        '**/BrandIcon.vue', '**/BrandMark.vue', '**/FormField.vue', '**/PackageCard.vue',
      ],
    },
    { path: designSystemComponentsDir('primitives'), pathPrefix: false },
    { path: '~/components', pathPrefix: false },
  ],

  // @artenanagara/zenko-design-system ships raw .vue/.ts source (no pre-build step) since
  // both apps run the same Nuxt/Vue major versions — transpile so Nitro's
  // SSR bundling processes it instead of treating it as an opaque external.
  build: {
    transpile: ['@artenanagara/zenko-design-system'],
  },

  // Nuxt's auto-import transform excludes node_modules by default (sensible
  // for prebuilt deps, but this one ships raw source that relies on the same
  // auto-imported `ref`/`computed`/`watchEffect`/etc. its own dev server
  // provides — e.g. AppModal.vue calls `watchEffect` with no explicit
  // import). Opt this one package back in, or those calls throw
  // "watchEffect is not defined" once installed for real (a `file:` link
  // masked this, since its resolved path didn't read as node_modules).
  imports: {
    transform: {
      include: [/node_modules\/@artenanagara\/zenko-design-system/],
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    externals: {
      // @aarkue/tiptap-math-extension imports 'evaluatex/dist/evaluatex' with
      // no file extension. Left external, that specifier survives into the
      // server output and Node's ESM loader — which does no extension
      // guessing — throws ERR_MODULE_NOT_FOUND, so every page carrying the
      // rich-text editor 500s on the server (the tutor product wizard, its
      // edit page). Bundling both packages in resolves the path at build time.
      inline: ['@aarkue/tiptap-math-extension', 'evaluatex'],
    },
  },

  runtimeConfig: {
    public: {
      // Application version maintained by Release Please from package.json.
      appVersion: packageMetadata.version,
      // Base URL of zenko-api. Override with NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:8080/api/v1',
      // Whether checkout may call POST /orders. How the resulting order is
      // actually paid is the server's decision — a Duitku QRIS charge, or the
      // manual QRIS channel where the buyer transfers to Zenko's static QR and
      // an admin verifies it (zenko-api's PAYMENT_CHANNEL). This flag only
      // says whether to attempt an order at all; while off, the checkout page
      // says payment is not connected instead of placing one.
      //
      // Still off by default, on purpose. It now gates two things, not one:
      // the tutor price input follows it too (see TutorProductWizard's
      // PRICE_INPUT_DISABLED), and turning it on without also pointing
      // zenko-api at a working channel would create orders with nothing to pay
      // them with. Turn it on per environment, together with
      // PAYMENT_CHANNEL=manual_qris on the API.
      // Turn on with NUXT_PUBLIC_PAYMENT_ENABLED=true.
      paymentEnabled: false,
		// Allows the staging tutor editor to write question content on products
		// that are already live. The API has the matching server-side switch;
		// keep both off by default so production remains read-only for live
		// content. Turn on with NUXT_PUBLIC_TUTOR_LIVE_CONTENT_EDIT_ENABLED=true.
		tutorLiveContentEditEnabled: false,
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
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
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
