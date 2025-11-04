<template>
  <div class="space-y-4">
    <div
      v-for="round in rounds"
      :key="round.id"
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Round {{ round.round_number }}
          </h3>
          <div class="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
            <span>Input: {{ round.prompt_tokens.toLocaleString() }} tokens</span>
            <span>Output: {{ getRoundOutputTokens(round).toLocaleString() }} tokens</span>
            <span class="font-semibold">Round Total: {{ getRoundTotalTokens(round).toLocaleString() }} tokens</span>
            <span class="font-semibold text-blue-600 dark:text-blue-400">Cumulative: {{ getCumulativeTotal(round).toLocaleString() }} tokens</span>
          </div>
        </div>
        <button
          @click="$emit('delete-round', round.id)"
          class="text-red-500 hover:text-red-700"
        >
          <Trash2Icon class="w-5 h-5" />
        </button>
      </div>

      <!-- Prompt -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Prompt
        </label>
        <div class="relative">
          <textarea
            :value="round.prompt"
            @input="$emit('update-prompt', round.id, ($event.target as HTMLTextAreaElement).value)"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            rows="2"
          />
          <span class="absolute top-2 right-2 text-xs text-gray-500 dark:text-gray-400">
            {{ round.prompt_tokens }} tokens
          </span>
        </div>
      </div>

      <!-- Agent Responses -->
      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Agent Responses
        </label>
        <div
          v-for="response in round.responses"
          :key="response.id"
          class="space-y-2"
        >
          <div class="flex items-center space-x-2 mb-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ getAgentName(response.agent_id) }}:
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ response.token_count }} tokens
            </span>
          </div>
          <textarea
            :value="response.response_text"
            @input="$emit('update-response', round.id, response.agent_id, ($event.target as HTMLTextAreaElement).value)"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            rows="2"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import type { RoundWithResponses, Agent } from '@susai/types'

// Explicitly register the component to avoid Vue warnings
const Trash2Icon = Trash2

const props = defineProps<{
  rounds: RoundWithResponses[]
  agents: Agent[]
}>()

defineEmits<{
  'delete-round': [id: string]
  'update-prompt': [roundId: string, prompt: string]
  'update-response': [roundId: string, agentId: string, responseText: string]
}>()

const getAgentName = (agentId: string): string => {
  return props.agents.find(a => a.id === agentId)?.name || 'Unknown'
}

const getRoundOutputTokens = (round: RoundWithResponses): number => {
  return round.responses.reduce((sum: number, r: any) => sum + (r.token_count || 0), 0)
}

const getRoundTotalTokens = (round: RoundWithResponses): number => {
  const agentCount = props.agents.length || 1
  // Single-agent input tokens (prompt_tokens is the base prompt token count)
  const singleAgentInput = round.prompt_tokens || 0
  // Output tokens (sum of all agent responses - this is total output, not per-agent)
  const totalOutputTokens = getRoundOutputTokens(round)
  // Round total = (single agent input + total output) × number of agents
  return (singleAgentInput + totalOutputTokens) * agentCount
}

const getCumulativeTotal = (round: RoundWithResponses): number => {
  // Calculate cumulative total up to and including this round
  const currentRoundIndex = props.rounds.findIndex(r => r.id === round.id)
  if (currentRoundIndex === -1) return getRoundTotalTokens(round)
  
  const agentCount = props.agents.length || 1
  let cumulative = 0
  
  for (let i = 0; i <= currentRoundIndex; i++) {
    const r = props.rounds[i]
    if (!r) continue
    
    const singleAgentInput = r.prompt_tokens || 0
    const totalOutputTokens = r.responses.reduce((sum: number, res: any) => sum + (res.token_count || 0), 0)
    const roundTotal = (singleAgentInput + totalOutputTokens) * agentCount
    
    cumulative += roundTotal
  }
  return cumulative
}
</script>

