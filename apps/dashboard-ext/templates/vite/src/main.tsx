import 'epos'
import './main.css'

const App = () => {
  return (
    <div className="flex items-center gap-3 p-4 font-sans">
      <img src={epos.assets.url('/dist/epos.svg')} className="size-6" />
      Epos + Vite
    </div>
  )
}

epos.render(<App />)
