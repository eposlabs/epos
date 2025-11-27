import './core/core-globals'
import './core/core-live-reload.sw'
import './core/core-units'
import './layers/index.sw'

await new sw.App().init()
