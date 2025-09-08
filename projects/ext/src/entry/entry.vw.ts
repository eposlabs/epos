import './entry-globals'
import './entry-units'
import '../layers/index.gl'
import '../layers/index.vw'
import '../app/app.vw.css'

$: (async () => {
  try {
    await $vw.App.create()
  } catch (e) {
    console.error(e)
  }
})()
