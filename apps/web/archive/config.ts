// {
//   text: 'epos.json',
//   items: [
//     { text: 'Basic setup', link: '/docs/spec' },
//     { text: 'Multiple targets', link: '/docs/spec-multiple-targets' },
//   ],
// },
// {
//   text: 'Guide',
//   items: [
//     { text: 'Project Structure', link: '/docs/guide-project-structure' },
//     { text: 'Manifest', link: '/docs/guide-manifest' },
//   Vite Setup
//   Rendering / Messaging / State management / Storage / Working with Static files / Frames / Libs
//     { text: 'Background', link: '/docs/guide-background' },
//     { text: 'Popup', link: '/docs/guide-popup' },
//     { text: 'Side Panel', link: '/docs/guide-side-panel' },
//     { text: 'Content Scripts', link: '/docs/guide-content-scripts' },
//   ],
// },
{
  text: 'API',
  link: '/docs/api',
  items: [
    {
      text: 'General',
      link: '/docs/api-general',
      collapsed: false,
      items: [
        { text: 'epos.fetch', link: '/docs/api-general#epos-fetch' },
        { text: 'epos.browser', link: '/docs/api-general#epos-browser' },
        { text: 'epos.element', link: '/docs/api-general#epos-element' },
        { text: 'epos.render', link: '/docs/api-general#epos-render' },
        { text: 'epos.component', link: '/docs/api-general#epos-component' },
      ],
    },
    {
      text: 'Bus',
      link: '/docs/api-bus',
      collapsed: false,
      items: [
        { text: 'epos.bus.on', link: '/docs/api-bus#epos-bus-on' },
        { text: 'epos.bus.off', link: '/docs/api-bus#epos-bus-off' },
        { text: 'epos.bus.send', link: '/docs/api-bus#epos-bus-send' },
        { text: 'epos.bus.emit', link: '/docs/api-bus#epos-bus-emit' },
        { text: 'epos.bus.once', link: '/docs/api-bus#epos-bus-once' },
        { text: 'epos.bus.setSignal', link: '/docs/api-bus#epos-bus-setsignal' },
        { text: 'epos.bus.waitSignal', link: '/docs/api-bus#epos-bus-waitsignal' },
      ],
    },
    { text: 'State', link: '/docs/api-state' },
    { text: 'Storage', link: '/docs/api-storage' },
    { text: 'Static', link: '/docs/api-static' },
    { text: 'Frame', link: '/docs/api-frame' },
    { text: 'Env', link: '/docs/api-env' },
    { text: 'Libs', link: '/docs/api-libs' },
  ],
},
