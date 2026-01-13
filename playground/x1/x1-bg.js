self.epos = epos
// console.warn('x1:bg43')
// console.warn(1)
const frames = await epos.frames.list()
for (const frame of frames) await epos.frames.remove(frame.id)
epos.frames.create('https://epos.dev')
// console.warn('bg tabid')
// console.error('bg error')
// throw new Error('some custom error')
