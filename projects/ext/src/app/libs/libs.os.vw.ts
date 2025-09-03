import { render } from 'preact'
import { useState } from 'preact/hooks'
import { proxy, useSnapshot } from 'valtio'

export class Libs extends $osVw.Unit {
  preact = { render, useState }
  valtio = { proxy, useSnapshot }
}
