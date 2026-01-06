import { createContext, Fragment, render } from 'preact'
import { useContext, useEffect, useState } from 'preact/hooks'

export class Libs extends osVw.Unit {
  preact = { render, createContext, useState, useContext, useEffect, Fragment }
}
