import hljs from 'highlight.js'
import jsonLanguage from 'highlight.js/lib/languages/json'
import hljsDarkCss from 'highlight.js/styles/github-dark-dimmed.css?raw'
import hljsLightCss from 'highlight.js/styles/github.css?raw'

export class Highlight extends gl.Unit {
  init() {
    hljs.registerLanguage('json', jsonLanguage)
  }

  SetupView() {
    return <style>{this.$.theme.value === 'light' ? hljsLightCss : hljsDarkCss}</style>
  }

  Json({ value }: { value: string }) {
    return <pre dangerouslySetInnerHTML={{ __html: hljs.highlight(value, { language: 'json' }).value }} />
  }
}
