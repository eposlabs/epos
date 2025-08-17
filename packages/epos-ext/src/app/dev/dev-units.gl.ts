export class DevUnits extends $gl.Unit {
  constructor(parent: $gl.Unit) {
    super(parent)
    if (DROPCAP_PROD) return
    self.$units = {
      ...$gl,
      ...$exOsSwVw,
      ...$exOsVw,
      ...$exOs,
      ...$exSw,
      ...$osVw,
      ...$swVw,
      ...$cs,
      ...$ex,
      ...$os,
      ...$sw,
      ...$vw,
    }
  }
}

declare global {
  var $units: any
}
