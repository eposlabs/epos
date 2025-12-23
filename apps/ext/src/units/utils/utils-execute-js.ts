export function executeJs(js: string) {
  const div = document.createElement('div')
  // It is important to pass `URL` as `window.URL`, otherwise `URL` equals to `location.href` (string)
  div.setAttribute('onload', `(URL => { ${js} })(window.URL)`)
  div.dispatchEvent(new Event('load'))
}
