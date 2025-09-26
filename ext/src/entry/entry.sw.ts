import './entry-globals'
import './entry-live-reload.sw'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.sw'

$: (async () => {
  try {
    await $sw.App.create()
  } catch (e) {
    console.error(e)
  }
})()
