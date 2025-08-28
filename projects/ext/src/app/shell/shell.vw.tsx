// TODO: selectedPkgName should live in shell state
export class Shell extends $vw.Unit {
  constructor(parent: $vw.Unit) {
    super(parent)
  }

  async init() {
    if (!this.$.env.is.vwShell) return
    const root = document.createElement('div')
    root.id = 'root'
    document.body.append(root)
    this.$.libs.preact.render(<this.ui />, root)
  }

  ui = () => {
    return (
      <div>
        {/* <this.$.pkgs.Select /> */}
        <this.$.pkgs.ui />
      </div>
    )
  }
}
