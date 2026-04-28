import { defineBackground } from '#imports'

export default defineBackground(() => {
  console.log('background started', import.meta.env)
})
