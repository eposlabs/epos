import * as nanoid from 'nanoid'
import { render } from 'preact'
import { useState } from 'preact/hooks'
import { proxy, useSnapshot } from 'valtio'

export class Libs extends $osVw.Unit {
  nanoid = nanoid
  preact = { render, useState }
  valtio = { proxy, useSnapshot }
}
