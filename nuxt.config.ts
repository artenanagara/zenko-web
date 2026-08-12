import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    public: {
      // Base URL of zenko-api. Override with NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:8080/api/v1',
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
