<template>
  <div
    inert="true"
    class="absolute inset-0 -top-16 opacity-20"
    style="
      --color: 16px;
      --size: var(--vp-c-divider);
      background-image:
        linear-gradient(to right, var(--size) 1px, transparent 1px),
        linear-gradient(to bottom, var(--size) 1px, transparent 1px);
      background-size: var(--color) var(--color);
      background-position: calc((100vw - var(--spacing-page)) / 2) 0;
    "
  />
</template>
