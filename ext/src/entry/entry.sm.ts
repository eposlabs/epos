import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.sm'

$: (async () => {
  try {
    await $sm.App.create()
  } catch (e) {
    console.error(e)
  }
})()
