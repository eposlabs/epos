import { render, createContext, Fragment } from 'preact'
import { useState, useContext, useEffect } from 'preact/hooks'

export class Libs extends $osVw.Unit {
  preact = { render, createContext, useState, useContext, useEffect, Fragment }
}
