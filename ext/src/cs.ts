import './core/globals'
import './core/units'
import './layers/index.gl'
import './layers/index.cs'

$: (async () => {
  try {
    await $cs.App.create()
  } catch (e) {
    console.error(e)
  }
})()
