import { ensureArray, is, Queue, QueueMap, safe, wait } from 'dropcap/utils'
import { bind } from './utils-bind'
import { convertImage } from './utils-convert-image'
import { equal } from './utils-equal'
import { get } from './utils-get'
import { hash } from './utils-hash'
import { id } from './utils-id'
import { merge } from './utils-merge'
import { normalizeUrl } from './utils-normalize-url'
import { set } from './utils-set'
import { time } from './utils-time'
import { toPascalCase } from './utils-to-pascal-case'
import { unique } from './utils-unique'

export class Utils extends $exOsSwVw.Unit {
  initOs() {
    this.$.bus.on('utils.convertImage', this.convertImage, this)
  }

  bind = bind
  convertImage = convertImage
  ensureArray = ensureArray
  equal = equal
  get = get
  hash = hash
  id = id
  is = is
  merge = merge
  normalizeUrl = normalizeUrl
  Queue = Queue
  QueueMap = QueueMap
  safe = safe
  set = set
  time = time
  toPascalCase = toPascalCase
  unique = unique
  wait = wait
}
