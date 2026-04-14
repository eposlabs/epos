import { Unit as BaseUnit } from 'epos-unit'

export class Unit<T extends gl = gl> extends BaseUnit<T['App']> {}

gl.Unit = Unit
