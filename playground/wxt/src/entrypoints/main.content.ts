import { browser, defineContentScript } from '#imports'

export default defineContentScript({
  world: 'MAIN',
  matches: ['<all_urls>'],
  main: () => {},
})
