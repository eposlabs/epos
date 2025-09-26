import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.os'

$: (async () => {
  try {
    await $os.App.create()
  } catch (e) {
    console.error(e)
  }
})()
