/// <reference types="epos" />

self.epos = epos

document.body.style = 'font-family: system-ui; margin: 0;'

if (self === top) {
  document.body.innerHTML = `
    <iframe src="https://epos.dev/@x1" style="width: 600px; height: 500px; border: 1px solid black;"/>
  `
} else {
  document.body.innerHTML = `
    <div style="background: lightblue">
      X1 FRAME
    </div>
  `
}
