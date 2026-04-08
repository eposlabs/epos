<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import Eyebrow from './ui/eyebrow.vue'

const isOpen = ref(false)

function openDialog() {
  isOpen.value = true
}

function closeDialog() {
  isOpen.value = false
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeDialog()
  }
}

watch(isOpen, value => {
  if (typeof document === 'undefined') {
    return
  }

  document.body.style.overflow = value ? 'hidden' : ''

  if (value) {
    window.addEventListener('keydown', handleKeydown)
    return
  }

  window.removeEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }

  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div>
    <div class="flex flex-col gap-5 sm:flex-row">
      <button
        class="cursor-pointer border border-black/20 bg-brand px-11 py-2.5 text-center text-base font-medium text-main dark:border-brand dark:text-black"
        type="button"
        @click="openDialog"
      >
        Install Epos
      </button>
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

    <Teleport to="body">
      <Transition
        enter-active-class="duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isOpen"
          aria-modal="true"
          class="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          @click.self="closeDialog"
        >
          <div class="w-full max-w-2xl border border-divider bg-(--vp-c-bg) p-7">
            <div class="flex items-start justify-between gap-4">
              <div>
                <Eyebrow>INSTALL EPOS</Eyebrow>
                <h2 class="mt-4 text-3xl font-medium tracking-tight text-main">Epos is Under Review</h2>
              </div>
              <button
                aria-label="Close dialog"
                class="cursor-pointer border border-divider p-2 text-main transition hover:bg-zinc-100 dark:border-white/10 dark:hover:bg-zinc-800"
                type="button"
                @click="closeDialog"
              >
                <svg aria-hidden="true" class="size-5" fill="none" viewBox="0 0 24 24">
                  <path d="M6 6L18 18" stroke="currentColor" stroke-linecap="round" stroke-width="1.75" />
                  <path d="M18 6L6 18" stroke="currentColor" stroke-linecap="round" stroke-width="1.75" />
                </svg>
              </button>
            </div>

            <div class="mt-6 max-w-xl text-lg leading-8 text-dim">
              The Chrome Web Store build is currently under review. You can use Epos right now by downloading the current
              engine ZIP and installing it manually in your browser.
            </div>

            <div
              class="mt-7 flex flex-col gap-3 border-t border-divider pt-7 sm:flex-row sm:items-center dark:border-white/10"
            >
              <a
                class="border border-black/20 bg-brand px-6 py-3 text-center text-base font-medium text-main dark:border-brand dark:text-black"
                download
                href="/epos-1.9.zip"
              >
                Download epos-1.9.zip
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
