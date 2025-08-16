import './entry-globals'

import './entry-live-reload.sw'

import './entry-units'

import '@/layers/index.gl'

import '@/layers/index.sw'

new $sw.App().init()
