import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitepress'

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
      level: 2,
    },

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Overview', link: '/guide/' },
            { text: 'Features', link: '/guide/features' },
          ],
        },
        {
          text: 'Guide',
          items: [
            { text: 'Basics', link: '/guide/basics' },
            { text: 'Vite Setup', link: '/guide/vite' },
            { text: 'Rendering', link: '/guide/rendering' },
            { text: 'Messaging', link: '/guide/messaging' },
            { text: 'State', link: '/guide/state' },
            { text: 'Environment', link: '/guide/environment' },
            { text: 'Storage', link: '/guide/storage' },
            { text: 'Assets', link: '/guide/assets' },
            { text: 'Libs', link: '/guide/libs' },
            { text: 'epos.json', link: '/guide/epos-json' },
            { text: 'Permissions', link: '/guide/permissions' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'epos.*', link: '/api/general' },
            { text: 'epos.env.*', link: '/api/env' },
            { text: 'epos.dom.*', link: '/api/dom' },
            { text: 'epos.bus.*', link: '/api/bus' },
            { text: 'epos.state.*', link: '/api/state' },
            { text: 'epos.storage.*', link: '/api/storage' },
            { text: 'epos.assets.*', link: '/api/assets' },
            { text: 'epos.frames.*', link: '/api/frames' },
            { text: 'epos.projects.*', link: '/api/projects' },
            { text: 'epos.libs.*', link: '/api/libs' },
          ],
        },
      ],
    },

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
