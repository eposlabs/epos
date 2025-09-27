import './core/globals'
import './core/live-reload.sw'
import './core/units'
import './layers/index.gl'
import './layers/index.sw'

$: (async () => {
  try {
    await $sw.App.create()
  } catch (e) {
    console.error(e)
  }
})()
