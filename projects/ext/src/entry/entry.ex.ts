import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.ex'

$: (async () => {
  try {
    await new $ex.App().init()
  } catch (e) {
    console.error(e)
  }
})()
