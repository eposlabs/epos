import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.cs'

$: (async () => {
  try {
    await new $cs.App().init()
  } catch (e) {
    console.error(e)
  }
})()
