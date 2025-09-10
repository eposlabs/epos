## Runtime Contexts

- **Service Worker**
  - sw

- **Offscreen**
  - os
  - csFrame + exFrameWeb (web frame)
  - exFrameExtBackground (pkg background frame)

- **View (panel/popup)**
  - vw
  - exFrameExtPopup (pkg popup frame)
  - exFrameExtPanel (pkg panel frame)

- **Tab**
  - csTab + exTab (ex.js + pkg injection)
  - csFrame + exFrameWeb (web frame)

## Bus Locus

- **Service Worker**
  - sw - `sw`

- **Offscreen**
  - os - `ext-page`
  - csFrame + exFrameWeb - `cs-frame` + `frame`. Forwards messages to self.top (`ext-page`).
  - exFrameExtBackground - `frame`. Forwards messages to self.top (`ext-page`).

- **View (panel/popup)**
  - vw - `ext-page`
  - exFrameExtPopup - `frame`. Forwards messages to self.top (`ext-page`).
  - exFrameExtPanel - `frame`. Forwards messages to self.top (`ext-page`).

- **Tab**
  - csTab + exTab - `cs-tab` + `tab`. Forwards messages to `service-worker`.
  - csFrame + exFrameWeb - `frame-cs` + `frame`. Forwards messages to self.top (`tab-content-script`).
