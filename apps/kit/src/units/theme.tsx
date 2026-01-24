export class Theme extends gl.Unit {
  value: 'light' | 'dark' = this.getSystemTheme()

  get inert() {
    return {
      systemThemeWatcher: window.matchMedia('(prefers-color-scheme: dark)'),
    }
  }

  attach() {
    this.value = this.getSystemTheme()
    this.inert.systemThemeWatcher.addEventListener('change', this.onSystemThemeChange)
    this.syncValueWithClass()
  }

  detach() {
    this.inert.systemThemeWatcher.removeEventListener('change', this.onSystemThemeChange)
  }

  private syncValueWithClass() {
    this.reaction(
      () => this.value,
      () => document.documentElement.classList.toggle('dark', this.value === 'dark'),
      { fireImmediately: true },
    )
  }

  private getSystemTheme() {
    return this.inert.systemThemeWatcher.matches ? 'dark' : 'light'
  }

  private onSystemThemeChange() {
    this.value = this.getSystemTheme()
  }

  static versioner = this.defineVersioner({
    1(this: any) {
      delete this.abc
    },
  })
}
