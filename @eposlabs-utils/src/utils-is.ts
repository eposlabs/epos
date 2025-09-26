import type { Fn, Obj, Arr } from './utils-types.ts'

const toString = Object.prototype.toString

export const is = {
  null: (v: unknown) => v === null,
  undefined: (v: unknown) => v === undefined,
  boolean: (v: unknown) => typeof v === 'boolean',
  number: (v: unknown) => typeof v === 'number',
  string: (v: unknown) => typeof v === 'string',
  symbol: (v: unknown) => typeof v === 'symbol',
  function: (v: unknown): v is Fn => typeof v === 'function',
  object: (v: unknown): v is Obj => toString.call(v) === '[object Object]',
  array: (v: unknown): v is Arr => Array.isArray(v),
  set: (v: unknown) => v instanceof Set,
  map: (v: unknown) => v instanceof Map,
  blob: (v: unknown) => v instanceof Blob,
  date: (v: unknown) => v instanceof Date,
  error: (v: unknown) => v instanceof Error,
  regex: (v: unknown) => v instanceof RegExp,
  promise: (v: unknown) => v instanceof Promise,
  uint8Array: (v: unknown) => v instanceof Uint8Array,
  uint16Array: (v: unknown) => v instanceof Uint16Array,
  uint32Array: (v: unknown) => v instanceof Uint32Array,

  nan: (v: unknown) => Number.isNaN(v),
  numeric: (v: unknown) => !is.nan(Number(v)),
  integer: (v: unknown): v is number => Number.isInteger(v),
  absent: (v: unknown) => v === null || v === undefined,
  present: <T>(v: T): v is NonNullable<T> => !is.absent(v),
  primitive: (v: unknown) => v !== Object(v),
  collection: (v: unknown) => is.array(v) || is.object(v),
  compound: (v: unknown) => v !== null && typeof v === 'object',
}
