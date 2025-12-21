import './core/core-globals'
import './core/core-reloader.sw'
import './core/core-units'
import './@layers/index.sw'

await new sw.App().init()
