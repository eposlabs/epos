import type { Downloads } from 'epos/browser'

export class ProjectBrowserDownloads extends gl.Unit {
  private $browser = this.closest(ex.ProjectBrowser)!

  createApi(): { [K in keyof Downloads]-?: unknown } {
    return {
      // Methods
      acceptDanger: this.$browser.createMethod('downloads.acceptDanger'),
      cancel: this.$browser.createMethod('downloads.cancel'),
      download: this.$browser.createMethod('downloads.download'),
      erase: this.$browser.createMethod('downloads.erase'),
      getFileIcon: this.$browser.createMethod('downloads.getFileIcon'),
      pause: this.$browser.createMethod('downloads.pause'),
      removeFile: this.$browser.createMethod('downloads.removeFile'),
      resume: this.$browser.createMethod('downloads.resume'),
      search: this.$browser.createMethod('downloads.search'),
      show: this.$browser.createMethod('downloads.show'),
      showDefaultFolder: this.$browser.createMethod('downloads.showDefaultFolder'),

      // Events
      onChanged: this.$browser.createEvent('downloads.onChanged'),
      onCreated: this.$browser.createEvent('downloads.onCreated'),
      onDeterminingFilename: this.$browser.createEvent('downloads.onDeterminingFilename'),
      onErased: this.$browser.createEvent('downloads.onErased'),

      // Values
      DangerType: this.$browser.getValue('downloads.DangerType'),
      FilenameConflictAction: this.$browser.getValue('downloads.FilenameConflictAction'),
      HttpMethod: this.$browser.getValue('downloads.HttpMethod'),
      InterruptReason: this.$browser.getValue('downloads.InterruptReason'),
      State: this.$browser.getValue('downloads.State'),
    }
  }
}
