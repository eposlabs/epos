export class Dev extends $ex.Unit {
  units = new $gl.DevUnits(this)
  store = new $exSw.DevStore(this)

  async init() {
    await this.store.init()
  }

  viteTest() {
    if (import.meta.env.PROD) return

    //      <script type="module">
    //  import { injectIntoGlobalHook } from "http://localhost:5173/@react-refresh";
    // injectIntoGlobalHook(window);
    // window.$RefreshReg$ = () => {};
    // window.$RefreshSig$ = () => (type) => type;</script>
    //     <script type="module" src="http://localhost:5173/@vite/client"></script>
    //     <script type="module" src="http://localhost:5173/src/main.tsx"></script>

    const root = document.createElement('div')
    root.id = 'root'
    document.documentElement.append(root)

    const script = document.createElement('script')
    script.type = 'module'
    script.textContent = `
      // import { injectIntoGlobalHook } from "http://localhost:5173/@react-refresh";
      // injectIntoGlobalHook(window);
      // window.$RefreshReg$ = () => {};
      // window.$RefreshSig$ = () => (type) => type;
      import "http://localhost:5173/@vite/client";
      import "http://localhost:5173/src/main.tsx";
    `
    document.documentElement.append(script)
  }
}
