import { render } from 'preact'
import { useState } from 'preact/hooks'

export class Libs extends $osVw.Unit {
  preact = { render, useState }
}
