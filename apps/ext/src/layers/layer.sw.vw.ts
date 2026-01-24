import { Medium, type Medium as MediumType } from '../units/medium.sw.vw.js'

Object.assign(swVw, {
  Medium,
})

declare global {
  const swVw: SwVw

  interface SwVw extends Gl {
    Medium: typeof Medium
  }

  interface swVw extends gl {
    Medium: Medium
  }

  namespace swVw {
    export type Medium = MediumType
  }
}
