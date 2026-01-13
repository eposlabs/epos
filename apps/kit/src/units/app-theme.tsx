export class AppTheme extends gl.Unit {
  value: 'light' | 'dark' = this.getSystemTheme()

  get state() {
    return {
      systemThemeWatcher: window.matchMedia('(prefers-color-scheme: dark)'),
    }
  }

  attach() {
    this.value = this.getSystemTheme()
    this.state.systemThemeWatcher.addEventListener('change', this.onSystemThemeChange)
    this.setDocumentElementClass()
  }

  detach() {
    this.state.systemThemeWatcher.removeEventListener('change', this.onSystemThemeChange)
  }

  private setDocumentElementClass() {
    this.reaction(
      () => this.value,
      () => document.documentElement.classList.toggle('dark', this.value === 'dark'),
      { fireImmediately: true },
    )
  }

  private getSystemTheme() {
    return this.state.systemThemeWatcher.matches ? 'dark' : 'light'
  }

  private onSystemThemeChange() {
    this.value = this.getSystemTheme()
  }
}
