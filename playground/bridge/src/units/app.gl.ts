export class App<T extends gl = gl> extends gl.Unit<T> {
  project = new gl.Project(this)
}
