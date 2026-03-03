export class ProjectEposDom extends ex.Unit {
  private $project = this.closest(ex.Project)!
  root: HTMLDivElement
  view: HTMLDivElement
  shadowRoot: ShadowRoot
  shadowView: HTMLDivElement

  constructor(parent: ex.Unit) {
    super(parent)
    const { root, view, shadowRoot, shadowView } = this.init()
    this.root = root
    this.view = view
    this.shadowRoot = shadowRoot
    this.shadowView = shadowView
  }

  private init() {
    // Get <epos> element
    const eposElement = document.querySelector('epos')
    if (!eposElement) throw this.never()

    // Create root project container
    const root = document.createElement('div')
    root.setAttribute('data-project-name', this.$project.spec.name)
    root.setAttribute('data-project-id', this.$project.id)
    root.setAttribute('data-epos', '')
    eposElement.append(root)

    // Create [data-view] element
    const view = document.createElement('div')
    view.setAttribute('data-view', '')
    root.append(view)

    // Create shadow DOM
    const shadow = document.createElement('div')
    shadow.setAttribute('data-shadow', '')
    const shadowRoot = shadow.attachShadow({ mode: 'open' })

    // Create [data-shadow-view] element inside shadow DOM
    const shadowView = document.createElement('div')
    shadowView.setAttribute('data-shadow-view', '')
    shadowRoot.append(shadowView)
    root.append(shadow)

    // Add shadow CSS if present
    if (this.$project.shadowCss) {
      // Hoist @property rules to the root DOM.
      // They don't work inside shadow DOM but are inherited from the root DOM.
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(this.$project.shadowCss)
      const rules = [...sheet.cssRules]
      const propertyRules = rules.filter(rule => rule.cssText.startsWith('@property'))
      if (propertyRules.length > 0) {
        const propertyRulesCss = propertyRules.map(rule => rule.cssText).join('\n')
        const blob = new Blob([propertyRulesCss], { type: 'text/css' })
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = URL.createObjectURL(blob)
        link.setAttribute('data-hoisted-property-rules', '')
        link.setAttribute('data-epos', '')
        root.prepend(link)
      }

      // Create <link/> for the shadow CSS
      const blob = new Blob([this.$project.shadowCss], { type: 'text/css' })
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = URL.createObjectURL(blob)
      link.setAttribute('data-epos', '')
      shadowRoot.append(link)
    }

    return {
      root,
      view,
      shadowRoot,
      shadowView,
    }
  }
}
