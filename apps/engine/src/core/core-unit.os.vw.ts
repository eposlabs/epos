import { BaseUnit } from './core-base-unit.js'

export class Unit extends BaseUnit<os.App | vw.App> {}

osVw.Unit = Unit
