---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: epos
  text: Web Extension Engine
  tagline: The opinionated engine for extension developers who want to skip the boilerplate and ship faster.
  actions:
    - theme: brand
      text: Get Started
      link: /guide
    - theme: alt
      text: Install Epos
      link: https://get.epos.dev

features:
  - title: Zero-Config Setup
    icon: |
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-columns3-cog-icon lucide-columns-3-cog"><path d="M10.5 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.5"/><path d="m14.3 19.6 1-.4"/><path d="M15 3v7.5"/><path d="m15.2 16.9-.9-.3"/><path d="m16.6 21.7.3-.9"/><path d="m16.8 15.3-.4-1"/><path d="m19.1 15.2.3-.9"/><path d="m19.6 21.7-.4-1"/><path d="m20.7 16.8 1-.4"/><path d="m21.7 19.4-.9-.3"/><path d="M9 3v18"/><circle cx="18" cy="18" r="3"/></svg>
    details: |
      Just link your project directory to the Epos and start coding. It manages the runtime environment and live-reloading without a manual build step.

  - title: Automatic State Sync
    icon: |
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database-zap-icon lucide-database-zap"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 15 21.84"/><path d="M21 5V8"/><path d="M21 12L18 17H22L19 22"/><path d="M3 12A9 3 0 0 0 14.59 14.87"/></svg>
    details: |
      <strong>State management that feels like magic.</strong> Modify a JavaScript object, and the changes are automatically persisted and synchronized across all extension contexts.

  - title: Simplified Messaging
    icon: |
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-route-icon lucide-route"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
    details: |
      10x better than standard APIs. Forget tracking Tab IDs or proxying messages. With epos.bus, you send a message once and it’s delivered to every listener across your entire extension ecosystem—no matter where they are.

  - title: Chrome APIs, Everywhere
    icon: |
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-puzzle-icon lucide-puzzle"><path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/></svg>
    details: |
      Access extension capabilities from anywhere. Epos wraps standard Chrome APIs so they can be called from content scripts or web pages without the usual restrictions.

  - title: Unified Storage
    icon: |
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database-icon lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
    details: |
      <strong>Simplified cross-context storage.</strong> Epos wraps IndexedDB with a straightforward key-value API that works seamlessly across all extension contexts—no setup required.

  - title: Integrated Storage
    icon: |
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database-icon lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
    details: |
      <strong>Simplified cross-context storage.</strong> Epos wraps IndexedDB with a straightforward key-value API that works seamlessly across all extension contexts—no setup required.
---

<!--
<div
  class="p-2 grid grid-cols-2 *:border-r *:border-b *:border-gray-200 *:odd:border-l *:nth-1:border-t *:nth-2:border-t"
>


<div class="p-4">
<h3 class="m-0!">State</h3>
<div class="*:bg-transparent! [&_button]:hidden! [&_.lang]:hidden! [&_pre]:p-0! [&_code]:p-0!">

```tsx
const state = await epos.state.connect({ theme: 'light' })
state.theme = 'dark' // auto-sync across all contexts
```

</div>
</div>


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
-->
