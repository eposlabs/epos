// Make changes in background:
const state = await epos.state.connect()
state.items = []
state.items.push('Hello world!')

// And they are reflected in the popup:
const state = await epos.state.connect()
state.items // ['Hello world!']
