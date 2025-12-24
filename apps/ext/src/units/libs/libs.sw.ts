import { matchPattern } from 'browser-extension-url-match'
import { parseSpec } from 'epos-spec'
import { compressToBase64 } from 'lz-string'
import * as mobx from 'mobx'
import stripJsonComments from 'strip-json-comments'
import { minify } from 'terser'
import * as yjs from 'yjs'

export class Libs extends sw.Unit {
  lzString = { compressToBase64 }
  matchPattern = matchPattern
  mobx = mobx
  parseSpec = parseSpec
  stripJsonComments = stripJsonComments
  terser = { minify }
  yjs = yjs

  constructor(parent: sw.Unit) {
    super(parent)

    // Configure MobX
    mobx.configure({ enforceActions: 'never' })
  }
}
