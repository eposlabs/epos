import './entry-globals'
import './entry-live-reload.sw'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.sw'

$: (async () => {
  try {
    await new $sw.App().init()
  } catch (e) {
    console.error(e)
  }
})()
