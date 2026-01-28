import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'epos',
  description: 'Browser Extension Engine',
  head: [['link', { rel: 'icon', href: '/favicon.svg' }]],
  outDir: 'dist',
  themeConfig: {
    outline: {
      level: 4, // show both h2 and h3
    },

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/docs/01' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Epos?', link: '/docs/01' },
          { text: 'Getting Started', link: '/docs/02' },
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
