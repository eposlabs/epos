export class Store extends $exSw.Unit {
  private states = new $exSw.StoreStates(this)
  private units = new $exSw.StoreUnits(this)
  private utils = new $exSw.StoreUtils(this)
  private local = new $exSw.StoreLocalState(this)

  connect = this.$.bind(this.states, 'connect')
  disconnect = this.$.bind(this.states, 'disconnect')
  transaction = this.$.bind(this.states, 'transaction')
  destroy = this.$.bind(this.states, 'destroy')
  isConnected = this.$.bind(this.states, 'isConnected')

  Unit = this.units.Unit
  register = this.$.bind(this.units, 'register')
  getRegisteredUnits = () => this.units.map

  get internal() {
    return {
      states: this.states,
      units: this.units,
      utils: this.utils,
    }
  }
}
