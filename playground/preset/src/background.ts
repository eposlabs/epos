const frames = await epos.frames.list()
for (const frame of frames) await epos.frames.remove(frame.id)
// const frameId = await epos.frames.create('https://epos.dev')
