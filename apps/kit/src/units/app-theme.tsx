export class AppTheme extends gl.Unit {
  value: 'light' | 'dark' = this.getSystemTheme()

  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------

  attach() {
    this.syncWithSystemTheme()
    this.setDocumentElementClass()
  }

  detach() {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.onSystemThemeChange)
  }

  // ---------------------------------------------------------------------------
  // TASKS
  // ---------------------------------------------------------------------------

  private syncWithSystemTheme() {
    this.value = this.getSystemTheme()
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.onSystemThemeChange)
  }

  private setDocumentElementClass() {
    this.reaction(
      () => this.value,
      () => document.documentElement.classList.toggle('dark', this.value === 'dark'),
      { fireImmediately: true },
    )
  }

  // ---------------------------------------------------------------------------
  // GENERAL
  // ---------------------------------------------------------------------------

  private getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  private onSystemThemeChange() {
    this.value = this.getSystemTheme()
  }
}
