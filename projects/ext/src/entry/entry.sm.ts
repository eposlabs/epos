import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.sm'

$: (async () => {
  try {
    await new $sm.App().init()
  } catch (e) {
    console.error(e)
  }
})()
