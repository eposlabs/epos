/// <reference types="epos" />

const s = await epos.state.connect(
  {
    v: 2,
    title: 'new-state',
  },
  {
    1() {
      console.log('!1')
    },
    2() {
      this.name = 'abc'
    },
  },
)

Object.assign(self, { s, epos })
