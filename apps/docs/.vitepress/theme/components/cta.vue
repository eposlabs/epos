<template>
  <div>
    <div class="flex flex-col gap-5 sm:flex-row">
      <a
        class="cursor-pointer border border-black/20 bg-brand px-11 py-2.5 text-center text-base font-medium text-main dark:border-brand dark:text-black"
        href="https://get.epos.dev"
      >
        Install Epos
      </a>
      <a
        :class="[
          'border border-black/20 px-11 py-2.5 text-center text-base font-medium text-main transition hover:bg-zinc-100',
          'dark:border-white/20 dark:hover:bg-zinc-800',
        ]"
        href="/guide"
      >
        Get Started
      </a>
    </div>
  </div>
</template>
