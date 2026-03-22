import hljs from 'highlight.js'
import jsonLanguage from 'highlight.js/lib/languages/json'
import hljsDarkCss from 'highlight.js/styles/github-dark-dimmed.css?raw'
import hljsLightCss from 'highlight.js/styles/github.css?raw'

export class Highlight extends gl.Unit {
  attach() {
    hljs.registerLanguage('json', jsonLanguage)
  }

  StyleView() {
    return <style>{this.$.theme.value === 'light' ? hljsLightCss : hljsDarkCss}</style>
  }

  JsonView({ value }: { value: string }) {
    return (
      <pre>
        <code dangerouslySetInnerHTML={{ __html: hljs.highlight(value, { language: 'json' }).value }} />
      </pre>
    )
  }
}
