import { colorHash, ensureArray, is, Queue, safe, safeSync, unique, wait } from 'dropcap/utils'
import { convertImage } from './utils-convert-image'
import { cx } from './utils-cx'
import { equal } from './utils-equal'
import { get } from './utils-get'
import { hash } from './utils-hash'
import { id } from './utils-id'
import { info } from './utils-info'
import { link } from './utils-link'
import { merge } from './utils-merge'
import { normalizeUrl } from './utils-normalize-url'
import { set } from './utils-set'
import { time } from './utils-time'
import { toPascalCase } from './utils-to-pascal-case'
import { without } from './utils-without'

export class Utils extends exOsSwVw.Unit {
  initOs() {
    this.$.bus.on('Utils.convertImage', this.convertImage, this)
    this.$.bus.on('Utils.createObjectUrl', (blob: Blob) => URL.createObjectURL(blob))
    this.$.bus.on('Utils.revokeObjectUrl', (url: string) => URL.revokeObjectURL(url))
  }

  colorHash = colorHash
  convertImage = convertImage
  cx = cx
  ensureArray = ensureArray
  equal = equal
  get = get
  hash = hash
  id = id
  info = info
  is = is
  link = link
  merge = merge
  normalizeUrl = normalizeUrl
  Queue = Queue
  safe = safe
  safeSync = safeSync
  set = set
  time = time
  toPascalCase = toPascalCase
  unique = unique
  wait = wait
  without = without
}
