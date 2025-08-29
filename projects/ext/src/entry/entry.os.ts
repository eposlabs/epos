import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.os'

$: (async () => {
  try {
    await new $os.App().init()
  } catch (e) {
    console.error(e)
  }
})()
