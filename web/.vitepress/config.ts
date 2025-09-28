import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'epos',
  description: 'Browser Extension Engine',
  head: [['link', { rel: 'icon', href: '/favicon.svg' }]],
  outDir: 'dist',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/docs/01' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        collapsed: false,
        items: [
          { text: 'What is Epos?', link: '/docs/01' },
          { text: 'Getting Started', link: '/docs/02' },
          { text: 'API Reference', link: '/docs/api' },
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
})
