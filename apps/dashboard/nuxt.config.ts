import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  alias: {
    "@susai/types": fileURLToPath(new URL("../../packages/types/src/index.ts", import.meta.url)),
    "@susai/config": fileURLToPath(new URL("../../packages/config/src/index.ts", import.meta.url)),
      "@susai/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@susai/api": fileURLToPath(new URL("../../packages/api/src/index.ts", import.meta.url)),
      "@susai/cli": fileURLToPath(new URL("../../packages/cli/src/index.ts", import.meta.url)),
  },
  devtools: { enabled: true },
  
  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true
  },

  // CSS framework
  css: ['~/assets/css/main.css'],

  // Modules
  modules: [
    '@nuxtjs/tailwindcss'
  ],

  // Runtime config for API URLs
  runtimeConfig: {
    public: {
      openMeteoApiUrl: 'https://api.open-meteo.com/v1/forecast',
      geocodingApiUrl: 'https://geocoding-api.open-meteo.com/v1/search',
      wattTimeApiUrl: 'https://api.watttime.org'
    }
  },

  // App configuration
  app: {
    head: {
      title: 'Sustainable AI Dashboard',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Sustainable AI Dashboard for carbon-aware AI development' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // SSR configuration for localhost development
  ssr: true,
  
  // Development server configuration
  devServer: {
    port: 3000,
    host: 'localhost',
    https: {
      key: './certs/localhost-key.pem',
      cert: './certs/localhost-cert.pem'
    }
  }

})

