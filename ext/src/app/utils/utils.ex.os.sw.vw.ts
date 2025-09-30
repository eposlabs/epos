import { ensureArray, is, Queue, QueueMap, safe, safeSync, unique, wait } from '@eposlabs/utils/ts'
import { convertImage } from './utils-convert-image'
import { cx } from './utils-cx'
import { equal } from './utils-equal'
import { get } from './utils-get'
import { hash } from './utils-hash'
import { id } from './utils-id'
import { link } from './utils-link'
import { merge } from './utils-merge'
import { normalizeUrl } from './utils-normalize-url'
import { set } from './utils-set'
import { time } from './utils-time'
import { toPascalCase } from './utils-to-pascal-case'

export class Utils extends $exOsSwVw.Unit {
  initOs() {
    this.$.bus.on('utils.convertImage', this.convertImage, this)
    this.$.bus.on('utils.createObjectUrl', (blob: Blob) => URL.createObjectURL(blob))
    this.$.bus.on('utils.revokeObjectUrl', (url: string) => URL.revokeObjectURL(url))
  }

  convertImage = convertImage
  cx = cx
  ensureArray = ensureArray
  equal = equal
  get = get
  hash = hash
  id = id
  is = is
  link = link
  merge = merge
  normalizeUrl = normalizeUrl
  Queue = Queue
  QueueMap = QueueMap
  safe = safe
  safeSync = safeSync
  set = set
  time = time
  toPascalCase = toPascalCase
  unique = unique
  wait = wait
}
