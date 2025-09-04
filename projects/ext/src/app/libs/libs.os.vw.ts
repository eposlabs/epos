import { render, createContext } from 'preact'
import { useState, useContext } from 'preact/hooks'

export class Libs extends $osVw.Unit {
  preact = { render, createContext, useState, useContext }
}
