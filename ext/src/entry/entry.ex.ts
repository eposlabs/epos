import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.ex'

$: (async () => {
  try {
    await $ex.App.create()
  } catch (e) {
    console.error(e)
  }
})()
