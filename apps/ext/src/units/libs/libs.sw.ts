import { matchPattern } from 'browser-extension-url-match'
import { parseEposSpec } from 'epos-spec'
import { compressToBase64 } from 'lz-string'
import * as mobx from 'mobx'
import stripJsonComments from 'strip-json-comments'
import { minify } from 'terser'
import * as yjs from 'yjs'

export class Libs extends sw.Unit {
  lzString = { compressToBase64 }
  matchPattern = matchPattern
  mobx = mobx
  parseEposSpec = parseEposSpec
  stripJsonComments = stripJsonComments
  terser = { minify }
  yjs = yjs

  constructor(parent: sw.Unit) {
    super(parent)

    // Configure MobX
    mobx.configure({ enforceActions: 'never' })
  }
}
