import './app.css'

const App = epos.component(() => {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <img src={epos.assets.url('./public/logo.svg')} className="size-6" />
        <h1>Preset App</h1>
      </div>
      <button onMouseDown={() => state.count++} className="rounded-sm bg-amber-200 p-2 text-black">
        Click me [{state.count}]
      </button>
    </div>
  )
})

const state = await epos.state.connect({ count: 0 })
epos.render(<App />)
