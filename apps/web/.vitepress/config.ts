import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'epos',
  description: 'Browser Extension Engine',
  head: [['link', { rel: 'icon', href: '/favicon.svg' }]],
  outDir: 'dist',
  vite: {
    plugins: [tailwindcss()],
  },
  themeConfig: {
    outline: {
      level: 4, // show both h2 and h3
    },

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/docs/intro-what-is-epos' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Epos?', link: '/docs/intro-what-is-epos' },
          { text: 'Getting Started', link: '/docs/intro-getting-started' },
        ],
      },
      {
        text: 'Guide',
        items: [
          { text: 'Your First Extension', link: '/docs/guide-your-first-extension' },
          { text: 'Configuration (epos.json)', link: '/docs/guide-configuration' },
        ],
      },
      {
        text: 'APIs',
        link: '/docs/api',
        items: [
          { text: 'General', link: '/docs/api-general' },
          { text: 'Env', link: '/docs/api-env' },
          { text: 'DOM', link: '/docs/api-dom' },
          { text: 'Bus', link: '/docs/api-bus' },
          { text: 'State', link: '/docs/api-state' },
          { text: 'Storage', link: '/docs/api-storage' },
          { text: 'Frames', link: '/docs/api-frames' },
          { text: 'Assets', link: '/docs/api-assets' },
          { text: 'Projects', link: '/docs/api-projects' },
          { text: 'Libs', link: '/docs/api-libs' },
        ],
      },
    ],

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/eposlabs/epos',
      },
    ],
  },

  markdown: {
    // anchor: {
    //   slugify(str) {
    //     return str
    //       .toLowerCase()
    //       .split('(')[0]
    //       .split('<')[0]
    //       .replace(/[^a-z0-9_-]+/g, '-')
    //   },
    // },
  },
})
