import { ensureArray, is, Queue, safe, safeSync, unique, wait } from 'dropcap/utils'
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

export class Utils extends vw.Unit {
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
}
