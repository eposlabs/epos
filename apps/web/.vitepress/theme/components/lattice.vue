<template>
  <div
    inert="true"
    class="absolute inset-0 -top-16 opacity-20"
    style="
      --size: 32px;
      --color: var(--vp-c-divider);
      background-image:
        linear-gradient(to right, var(--color) 1px, transparent 1px),
        linear-gradient(to bottom, var(--color) 1px, transparent 1px);
      background-size: var(--size) var(--size);
      background-position: calc((100vw - var(--spacing-page)) / 2) 0;
    "
  />
</template>
