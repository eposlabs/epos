<script setup lang="ts">
import Eyebrow from './eyebrow.vue'

const steps = [
  { index: '01', title: 'Install', description: 'Install Epos from the Chrome Web Store.' },
  { index: '02', title: 'Connect', description: 'Connect a local project folder.' },
  { index: '03', title: 'Develop', description: 'Epos runs your code in the browser.' },
  { index: '04', title: 'Export', description: 'Click Export to get a ZIP bundle.' },
]
</script>

<template>
  <div class="flex border-t">
    <div class="w-[60%] p-12">
      <Eyebrow>WEB EXTENSION ENGINE</Eyebrow>
      <h1 class="mt-6 text-8xl font-medium tracking-tighter text-main">
        A better way to
        <div class="sm:hidden"></div>
        build browser
        <div class="sm:hidden"></div>
        extensions.
      </h1>
      <div class="mt-6">
        Epos gives you a <strong>zero-config</strong> workflow and <strong>powerful built-in features</strong>
        <div class="sm:hidden"></div>
        that work across all execution contexts with no extra setup.
      </div>
      <div class="mt-8 flex gap-5">
        <a
          class="border border-black/20 bg-brand px-11 py-2.5 text-base font-medium text-main dark:text-black"
          href="https://get.epos.dev"
        >
          Install Epos
        </a>
        <a
          :class="[
            'border border-black/20 px-11 py-2.5 text-base font-medium text-main transition hover:bg-zinc-100',
            'dark:border-white/20 dark:hover:bg-zinc-800',
          ]"
          href="/guide"
        >
          Get Started
        </a>
      </div>
    </div>
    <div class="grow p-12">
      <Eyebrow>WORKFLOW</Eyebrow>
      <div class="mt-8">
        <div class="flex" v-for="(step, index) in steps" :key="step.index">
          <div class="flex flex-col items-center">
            <div class="font-mono text-lg text-zinc-500">{{ step.index }}</div>
            <div class="my-2.5 h-15 w-px bg-divider" v-if="index < steps.length - 1"></div>
          </div>
          <div class="ml-7">
            <h3 class="text-lg text-main">{{ step.title }}</h3>
            <div class="mt-2 text-sm text-dim">{{ step.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
