import { Unit } from '@/unit'
import * as c12 from 'c12'
import chalk from 'chalk'
import * as chokidar from 'chokidar'
import cpx from 'cpx'
import esbuild from 'esbuild'
import * as lightningcss from 'lightningcss'
import * as childProcess from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import portfinder from 'portfinder'
import * as ws from 'ws'

import type { Project } from './project'

export class ProjectLibs extends Unit<Project> {
  c12 = c12
  chalk = chalk
  childProcess = childProcess
  chokidar = chokidar
  cpx = cpx
  esbuild = esbuild
  fs = fs
  lightningcss = lightningcss
  path = path
  portfinder = portfinder
  ws = ws
}
