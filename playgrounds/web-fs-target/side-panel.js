const n = 2

document.body.innerHTML = `
  ${epos.env.isPopup ? `<h1>Popup ${n}</h1>` : ''}
  ${epos.env.isSidePanel ? `<h1>Side Panel ${n}</h1>` : ''}
`
