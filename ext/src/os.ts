import './core/globals'
import './core/units'
import './layers/index.gl'
import './layers/index.os'

$: (async () => {
  try {
    await $os.App.create()
  } catch (e) {
    console.error(e)
  }
})()
