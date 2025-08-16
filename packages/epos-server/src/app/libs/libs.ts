import * as honoServer from '@hono/node-server'
import watcher from '@parcel/watcher'
import chalk from 'chalk'
import * as fileType from 'file-type'
import { globbyStream } from 'globby'
import * as hono from 'hono'
import * as honoHtml from 'hono/html'
import mime from 'mime'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { URLPattern } from 'node:url'
import stripJsonComments from 'strip-json-comments'
import * as ws from 'ws'

export class Libs extends $gl.Unit {
  chalk = chalk
  fileType = fileType
  fs = fs
  globbyStream = globbyStream
  hono = hono
  honoHtml = honoHtml
  honoServer = honoServer
  mime = mime
  path = path
  stripJsonComments = stripJsonComments
  URLPattern = URLPattern
  watcher = watcher
  ws = ws
}
