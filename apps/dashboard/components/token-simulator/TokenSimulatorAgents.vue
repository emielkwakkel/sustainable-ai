<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Agents</h2>
      <button
        @click="$emit('add-agent')"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Add Agent
      </button>
    </div>
    <div class="flex flex-wrap gap-2">
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
      >
        <span class="text-gray-900 dark:text-white">{{ agent.name }}</span>
        <button
          v-if="agents.length > 1"
          @click="$emit('delete-agent', agent.id)"
          class="text-red-500 hover:text-red-700"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import type { Agent } from '@susai/types'

defineProps<{
  agents: Agent[]
}>()

defineEmits<{
  'add-agent': []
  'delete-agent': [id: string]
}>()
</script>

