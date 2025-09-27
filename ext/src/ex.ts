import './core/globals'
import './core/units'
import './layers/index.gl'
import './layers/index.ex'

$: (async () => {
  try {
    await $ex.App.create()
  } catch (e) {
    console.error(e)
  }
})()
