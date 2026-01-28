import type { Obj } from '@eposlabs/utils'
import { Unit } from 'epos-unit'

export class Devkit extends Unit {
  get parent() {
    return this[epos.state.PARENT] as Obj
  }

  View() {
    const keys = Object.keys(this.parent)
    return (
      <div>
        <div>{this.parent['@'] as string}</div>
        <div>
          {keys.map(key => (
            <div key={key}>
              {key}: {String(this.parent[key])}
            </div>
          ))}
        </div>
      </div>
    )
  }
}
