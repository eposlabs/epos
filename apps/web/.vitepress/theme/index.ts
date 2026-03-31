import DefaultTheme from 'vitepress/theme'
import Landing from './components/landing.vue'
import './custom.css'
import LandingAi from './landing-ai.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: any) {
    app.component('Landing', Landing)
    app.component('LandingAi', LandingAi)
  },
}
