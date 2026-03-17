import DefaultTheme from 'vitepress/theme'
import './custom.css'
import Landing from './landing.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: any) {
    app.component('Landing', Landing)
  },
}
