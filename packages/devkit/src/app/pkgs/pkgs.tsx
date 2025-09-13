export class Pkgs extends $gl.Unit {
  list: $gl.Pkg[] = []

  async add() {
    const pkg = await $gl.Pkg.create(this.$)
    console.warn(pkg)
  }

  ui() {
    return (
      <div>
        <button onClick={() => this.add()}>ADD PACKAGE</button>
      </div>
    )
  }
}
