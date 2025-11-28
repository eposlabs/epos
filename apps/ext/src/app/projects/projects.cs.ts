export class Projects extends cs.Unit {
  injector = new cs.ProjectsInjector(this)

  async init() {
    await this.injector.init()
  }
}
