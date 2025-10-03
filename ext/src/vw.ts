import './core/globals'
import './core/units'
import './layers/index.vw'

$: (async () => {
  try {
    await vw.App.create()
  } catch (e) {
    console.error(e)
  }
})()
