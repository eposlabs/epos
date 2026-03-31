<template>
  <h2 data-slot="title" class="text-2xl font-medium tracking-tight text-main [:has(+[data-slot=description])]:mb-4">
    <slot />
  </h2>
</template>
