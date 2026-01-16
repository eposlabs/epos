import type { Tabs } from 'epos/browser'

export class ProjectBrowserTabs extends gl.Unit {
  private $browser = this.closest(ex.ProjectBrowser)!

  createApi(): { [K in keyof Tabs]-?: unknown } {
    return {
      // Methods
      captureVisibleTab: this.$browser.createMethod('tabs.captureVisibleTab'),
      create: this.$browser.createMethod('tabs.create'),
      detectLanguage: this.$browser.createMethod('tabs.detectLanguage'),
      discard: this.$browser.createMethod('tabs.discard'),
      duplicate: this.$browser.createMethod('tabs.duplicate'),
      get: this.$browser.createMethod('tabs.get'),
      getZoom: this.$browser.createMethod('tabs.getZoom'),
      getZoomSettings: this.$browser.createMethod('tabs.getZoomSettings'),
      goBack: this.$browser.createMethod('tabs.goBack'),
      goForward: this.$browser.createMethod('tabs.goForward'),
      group: this.$browser.createMethod('tabs.group'),
      highlight: this.$browser.createMethod('tabs.highlight'),
      move: this.$browser.createMethod('tabs.move'),
      query: this.$browser.createMethod('tabs.query'),
      reload: this.$browser.createMethod('tabs.reload'),
      remove: this.$browser.createMethod('tabs.remove'),
      setZoom: this.$browser.createMethod('tabs.setZoom'),
      setZoomSettings: this.$browser.createMethod('tabs.setZoomSettings'),
      ungroup: this.$browser.createMethod('tabs.ungroup'),
      update: this.$browser.createMethod('tabs.update'),

      // Events
      onActivated: this.$browser.createEvent('tabs.onActivated'),
      onAttached: this.$browser.createEvent('tabs.onAttached'),
      onCreated: this.$browser.createEvent('tabs.onCreated'),
      onDetached: this.$browser.createEvent('tabs.onDetached'),
      onHighlighted: this.$browser.createEvent('tabs.onHighlighted'),
      onMoved: this.$browser.createEvent('tabs.onMoved'),
      onRemoved: this.$browser.createEvent('tabs.onRemoved'),
      onReplaced: this.$browser.createEvent('tabs.onReplaced'),
      onUpdated: this.$browser.createEvent('tabs.onUpdated'),
      onZoomChange: this.$browser.createEvent('tabs.onZoomChange'),

      // Values
      MutedInfoReason: this.$browser.getValue('tabs.MutedInfoReason'),
      TabStatus: this.$browser.getValue('tabs.TabStatus'),
      WindowType: this.$browser.getValue('tabs.WindowType'),
      ZoomSettingsMode: this.$browser.getValue('tabs.ZoomSettingsMode'),
      ZoomSettingsScope: this.$browser.getValue('tabs.ZoomSettingsScope'),
      MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND: this.$browser.getValue('tabs.MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND'),
      TAB_ID_NONE: this.$browser.getValue('tabs.TAB_ID_NONE'),
      TAB_INDEX_NONE: this.$browser.getValue('tabs.TAB_INDEX_NONE'),
    }
  }
}
