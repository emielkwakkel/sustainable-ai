<template>
  <div class="flex items-center justify-between">
    <div>
      <nav class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
        <NuxtLink to="/projects" class="hover:text-gray-700 dark:hover:text-gray-300">Projects</NuxtLink>
        <ChevronRight class="w-4 h-4" />
        <span>{{ project?.name || 'Loading...' }}</span>
      </nav>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ project?.name || 'Loading...' }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ project?.description || 'No description' }}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button
        @click="$emit('import-csv')"
        class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
      >
        <FileText class="w-4 h-4" />
        CSV Import from Cursor
      </button>
      <button
        @click="$emit('import-api')"
        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
      >
        <Download class="w-4 h-4" />
        Import from Cursor
      </button>
      <button
        @click="$emit('add-calculation')"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        Add Calculation
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight, Download, Plus, FileText } from 'lucide-vue-next'
import type { Project } from '~/types/watttime'

interface Props {
  project: Project | null
}

interface Emits {
  (e: 'import-csv'): void
  (e: 'import-api'): void
  (e: 'add-calculation'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

