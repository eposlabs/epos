import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'epos',
  description: 'Browser Extension Engine',
  head: [['link', { rel: 'icon', href: '/favicon.svg' }]],
  outDir: 'dist',
  themeConfig: {
    outline: {
      level: [2, 3], // show both h2 and h3
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
      // {
      //   text: 'epos.json',
      //   items: [
      //     { text: 'Basic setup', link: '/docs/spec' },
      //     { text: 'Multiple targets', link: '/docs/spec-multiple-targets' },
      //   ],
      // },
      // {
      //   text: 'Guide',
      //   items: [
      //     { text: 'Project Structure', link: '/docs/guide-project-structure' },
      //     { text: 'Manifest', link: '/docs/guide-manifest' },
      //     { text: 'Background', link: '/docs/guide-background' },
      //     { text: 'Popup', link: '/docs/guide-popup' },
      //     { text: 'Side Panel', link: '/docs/guide-side-panel' },
      //     { text: 'Content Scripts', link: '/docs/guide-content-scripts' },
      //   ],
      // },
      {
        text: 'API',
        link: '/docs/api',
        items: [
          { text: 'General', link: '/docs/api-general' },
          { text: 'Bus', link: '/docs/api-bus' },
          { text: 'State', link: '/docs/api-state' },
          { text: 'Storage', link: '/docs/api-storage' },
          { text: 'Static', link: '/docs/api-static' },
          { text: 'Frame', link: '/docs/api-frame' },
          { text: 'Env', link: '/docs/api-env' },
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
