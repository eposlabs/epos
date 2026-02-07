import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'
import { groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Epos',
  description: 'Build Web Extensions',
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
      { text: 'Documentation', link: '/docs' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/docs/' },
          { text: 'Features', link: '/docs/features' },
        ],
      },
      {
        text: 'Guide',
        items: [
          { text: 'Basics', link: '/docs/basics' },
          { text: 'Vite Setup', link: '/docs/vite-setup' },
          { text: 'Rendering', link: '/docs/rendering' },
          { text: 'Environment', link: '/docs/environment' },
          { text: 'Messaging', link: '/docs/messaging' },
          { text: 'State Management', link: '/docs/state-management' },
          { text: 'Storage', link: '/docs/storage' },
          { text: 'Assets', link: '/docs/assets' },
          { text: 'Libs', link: '/docs/libs' },
          { text: 'epos.json', link: '/docs/epos-json' },
        ],
      },
      {
        text: 'APIs',
        items: [
          { text: 'Overview', link: '/docs/api-overview' },
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
