import { BaseUnit } from './core-base-unit.js'

export class Unit extends BaseUnit<ex.App | os.App | vw.App> {}

exOsVw.Unit = Unit
