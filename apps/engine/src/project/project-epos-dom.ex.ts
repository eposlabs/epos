export class ProjectEposDom extends ex.Unit {
  private $project = this.closest(ex.Project)!
  root: HTMLDivElement
  reactRoot: HTMLDivElement
  shadowRoot: ShadowRoot
  shadowReactRoot: HTMLDivElement

  constructor(parent: ex.Unit) {
    super(parent)
    const { root, reactRoot, shadowRoot, shadowReactRoot } = this.init()
    this.root = root
    this.reactRoot = reactRoot
    this.shadowRoot = shadowRoot
    this.shadowReactRoot = shadowReactRoot
  }

  private init() {
    // Get <epos> element
    const eposElement = document.querySelector('epos')
    if (!eposElement) throw this.never()

    // Create <div> container for the project
    const root = document.createElement('div')
    root.epos = true
    root.setAttribute('data-project-name', this.$project.spec.name)
    root.setAttribute('data-project-id', this.$project.id)
    eposElement.append(root)

    // Create [data-root] element
    const reactRoot = document.createElement('div')
    reactRoot.setAttribute('data-react-root', '')
    root.append(reactRoot)

    // Create [data-shadow] element with [data-root] element inside
    const shadow = document.createElement('div')
    shadow.setAttribute('data-shadow', '')
    const shadowRoot = shadow.attachShadow({ mode: 'open' })
    const shadowReactRoot = document.createElement('div')
    shadowReactRoot.setAttribute('data-react-root', '')
    shadowRoot.append(shadowReactRoot)
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
        link.epos = true
        link.rel = 'stylesheet'
        link.href = URL.createObjectURL(blob)
        link.setAttribute('data-hoisted-property-rules', '')
        root.prepend(link)
      }

      // Create <link/> for the shadow CSS
      const blob = new Blob([this.$project.shadowCss], { type: 'text/css' })
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = URL.createObjectURL(blob)
      shadowRoot.append(link)
    }

    return {
      root,
      shadowRoot,
      reactRoot,
      shadowReactRoot,
    }
  }
}
