import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: false,
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  manifest: {
    web_accessible_resources: [
      {
        resources: ['*'],
        matches: ['*://*/*'],
      },
    ],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  webExt: {
    disabled: true,
  },
})
