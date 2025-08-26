export class Pkgs extends $fg.Unit {
  list: $fg.Pkg[] = []

  async add() {
    const pkg = await $fg.Pkg.create(this.$)
    if (!pkg) return
    const exists = this.list.some(p => p.name === pkg.name)
    if (exists) {
      alert(`Package ${pkg.name} already exists`)
    } else {
      this.list.push(pkg)
    }
  }

  ui() {
    return (
      <div class="flex flex-col gap-12 p-10">
        <button onClick={() => this.add()} class="bg-amber-300">
          ADD PKG
        </button>
        <div>
          {this.list.map(pkg => {
            return <pkg.ui key={pkg.name} />
          })}
        </div>
      </div>
    )
  }

  static v = {
    1(this: any) {
      delete this.map
      this.list = []
    },
  }
}
