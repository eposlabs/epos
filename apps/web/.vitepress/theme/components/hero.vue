<script setup lang="ts">
import Cta from './cta.vue'
import Eyebrow from './ui/eyebrow.vue'

const steps = [
  { index: '01', title: 'Install', description: 'Install Epos from the Chrome Web Store.' },
  { index: '02', title: 'Connect', description: 'Connect a local project folder.' },
  { index: '03', title: 'Develop', description: 'Epos runs your code in the browser.' },
  { index: '04', title: 'Export', description: 'Click Export to get a ZIP bundle.' },
]
</script>

<template>
  <div class="flex px-12 py-16">
    <div class="grow">
      <Eyebrow>WEB EXTENSION ENGINE</Eyebrow>
      <h1 class="mt-6 text-8xl font-medium tracking-tighter text-main">
        A better way to
        <div class=""></div>
        build browser
        <div class=""></div>
        extensions.
      </h1>
      <div class="mt-6">
        Epos gives you a <strong>zero-config</strong> workflow and <strong>powerful built-in features</strong>
        <div class=""></div>
        that work across all execution contexts with no extra setup.
      </div>
      <Cta class="mt-8" />
    </div>
    <div class="w-fit pr-14 pl-12 text-nowrap">
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
