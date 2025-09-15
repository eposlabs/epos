// @ts-nocheck

const s = await this.$.store.connect(['a', 'b', 'c'], {
  getInitialState: () => ({ root: 0 }),
  versioner: { 2: s => (s.root = 3) },
})

const s = await this.$.store.connect(['a', 'b', 'c'], {
  getInitialState: () => ({}),
  versioner: { 2: s => (s.root = 3) },
})

Object.assign(self, { s, Robot, robot })
