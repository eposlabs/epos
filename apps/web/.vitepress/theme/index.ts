import DefaultTheme from 'vitepress/theme'
import Landing from './components/landing.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: any) {
    app.component('Landing', Landing)
  },
}
