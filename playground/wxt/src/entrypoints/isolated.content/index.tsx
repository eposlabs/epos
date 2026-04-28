import { createShadowRootUi, defineContentScript, injectScript } from '#imports'
import { App } from '@/components/App.tsx'
import ReactDOM from 'react-dom/client'
import './styles.css'

export default defineContentScript({
  world: 'ISOLATED',
  matches: ['<all_urls>'],
  runAt: 'document_end',
  cssInjectionMode: 'ui',
  main: async ctx => {
    const wxtElement = document.createElement('wxt')
    document.documentElement.prepend(wxtElement)
    wxtElement.style.position = 'fixed'
    wxtElement.style.inset = '0'
    wxtElement.style.zIndex = '2147483647'
    wxtElement.style.pointerEvents = 'none'

    await injectScript('/injection.js', { keepInDom: true })

    const ui = await createShadowRootUi(ctx, {
      name: 'shadow-root',
      position: 'inline',
      anchor: wxtElement,
      onMount(container) {
        const root = ReactDOM.createRoot(container)
        root.render(<App />)
        return root
      },
    })

    ui.mount()
  },
})
