---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: epos
  text: Web Extension Engine
  tagline: A Crafted Toolset for Rapid & Fun Development
  actions:
    - theme: brand
      text: Get Epos
      link: https://get.epos.dev
    - theme: alt
      text: Documentation
      link: /docs/intro-what-is-epos
---

<div
  class="p-2 grid grid-cols-2 *:border-r *:border-b *:border-gray-200 *:odd:border-l *:nth-1:border-t *:nth-2:border-t"
>

<!-- STATE -->

<div class="p-4">
<h3 class="m-0!">State</h3>
<div class="*:bg-transparent! [&_button]:hidden! [&_.lang]:hidden! [&_pre]:p-0! [&_code]:p-0!">

```tsx
const state = await epos.state.connect({ theme: 'light' })
state.theme = 'dark' // auto-sync across all contexts
```

</div>
</div>

<!-- BUS -->

<div class="p-4">
<h3 class="m-0!">Event Bus</h3>
<div class="*:bg-transparent! [&_button]:hidden! [&_.lang]:hidden! [&_pre]:p-0! [&_code]:p-0!">

```tsx
const state = await epos.state.connect({ theme: 'light' })
state.theme = 'dark' // auto-sync across all contexts
```

</div>
</div>
</div>
