import 'epos'
import './app.css'

const App = epos.component(() => {
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <img src={epos.asset.url('./public/logo.svg')} className="size-6" />
        <h1>Preset App</h1>
      </div>
      <button onClick={() => state.count++} className="bg-amber-200 p-2 rounded-sm">
        Click me [{state.count}]
      </button>
    </div>
  )
})

const state = await epos.state.connect({ count: 0 })
epos.render(<App />)
