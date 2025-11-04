<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Token Simulator</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Simulate single-agent and multi-agent chat conversations and track token usage and costs
        </p>
      </div>
      <button
        @click="showCreateChatModal = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Create New Chat
      </button>
    </div>

    <!-- Chat List -->
    <div v-if="!selectedChat" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="chat in chats"
        :key="chat.id"
        @click="selectChat(chat.id)"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:border-blue-500 transition-colors"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ chat.name }}</h3>
          <button
            @click.stop="deleteChatHandler(chat.id)"
            class="text-red-500 hover:text-red-700"
          >
            <Trash2Icon class="w-4 h-4" />
          </button>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Created: {{ new Date(chat.created_at).toLocaleDateString() }}
        </p>
        <div v-if="chat.total_input_tokens || chat.total_output_tokens" class="mt-4 space-y-1 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Input Tokens:</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ (chat.total_input_tokens || 0).toLocaleString() }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Output Tokens:</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ (chat.total_output_tokens || 0).toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Editor -->
    <div v-else class="space-y-6">
      <!-- Chat Header -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="selectedChat = null"
              class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div>
              <input
                v-model="chatName"
                @blur="updateChatName"
                class="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="showAddRoundModal = true"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Round
            </button>
          </div>
        </div>
      </div>

      <!-- Agents List -->
      <TokenSimulatorAgents
        :agents="currentChat?.agents || []"
        @add-agent="showAddAgentModal = true"
        @delete-agent="deleteAgentHandler"
      />

      <!-- Rounds -->
      <TokenSimulatorRounds
        :rounds="currentChat?.rounds || []"
        :agents="currentChat?.agents || []"
        @delete-round="deleteRoundHandler"
        @update-prompt="updateRoundPrompt"
        @update-response="updateRoundResponse"
      />

      <!-- Summary -->
      <TokenSimulatorSummary :summary="currentChat?.summary" />
    </div>

    <!-- Create Chat Modal -->
    <div
      v-if="showCreateChatModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showCreateChatModal = false"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
        @click.stop
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Chat</h2>
        <input
          v-model="newChatName"
          placeholder="Chat name (optional)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
        />
        <div class="flex justify-end space-x-2">
          <button
            @click="showCreateChatModal = false"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            @click="createChatHandler"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- Add Agent Modal -->
    <div
      v-if="showAddAgentModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showAddAgentModal = false"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
        @click.stop
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Agent</h2>
        <input
          v-model="newAgentName"
          placeholder="Agent name (optional)"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
        />
        <div class="flex justify-end space-x-2">
          <button
            @click="showAddAgentModal = false"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            @click="addAgentHandler"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add
          </button>
        </div>
      </div>
    </div>

    <!-- Add Round Modal -->
    <div
      v-if="showAddRoundModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showAddRoundModal = false"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add Round</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prompt
            </label>
            <textarea
              v-model="newRoundPrompt"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ countTokensInText(newRoundPrompt) }} tokens
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Agent Responses
            </label>
            <div
              v-for="agent in currentChat?.agents || []"
              :key="agent.id"
              class="mb-3"
            >
              <div class="flex items-center space-x-2 mb-1">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ agent.name }}:
                </span>
              </div>
              <textarea
                v-model="newRoundResponses[agent.id]"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows="2"
                :placeholder="`Enter response for ${agent.name}`"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ countTokensInText(newRoundResponses[agent.id] || '') }} tokens
              </p>
            </div>
          </div>
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button
            @click="showAddRoundModal = false"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            @click="addRoundHandler"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Round
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Trash2 } from 'lucide-vue-next'
import { useTokenSimulator, type ChatWithSummary } from '~/composables/useTokenSimulator'
import { countTokens } from '@susai/core'
import type { ChatWithDetails } from '@susai/types'
import TokenSimulatorAgents from '~/components/token-simulator/TokenSimulatorAgents.vue'
import TokenSimulatorRounds from '~/components/token-simulator/TokenSimulatorRounds.vue'
import TokenSimulatorSummary from '~/components/token-simulator/TokenSimulatorSummary.vue'

// Explicitly register icons to avoid Vue warnings
const Trash2Icon = Trash2

const { getChats, getChat, createChat, updateChat, deleteChat, createAgent, deleteAgent, createRound, updateRound, deleteRound } = useTokenSimulator()

// State
const chats = ref<ChatWithSummary[]>([])
const selectedChat = ref<string | null>(null)
const currentChat = ref<ChatWithDetails | null>(null)
const chatName = ref('')
const showCreateChatModal = ref(false)
const showAddAgentModal = ref(false)
const showAddRoundModal = ref(false)
const newChatName = ref('')
const newAgentName = ref('')
const newRoundPrompt = ref('')
const newRoundResponses = ref<Record<string, string>>({})

// User ID (in a real app, this would come from auth)
// Using a fixed UUID for default user - in production this would come from authentication
const userId = '00000000-0000-0000-0000-000000000000'

// Load chats on mount
onMounted(async () => {
  await loadChats()
})

// Load chats
const loadChats = async () => {
  try {
    chats.value = await getChats(userId)
  } catch (error) {
    console.error('Error loading chats:', error)
  }
}

// Select chat
const selectChat = async (chatId: string) => {
  selectedChat.value = chatId
  try {
    currentChat.value = await getChat(chatId)
    chatName.value = currentChat.value.name
  } catch (error) {
    console.error('Error loading chat:', error)
  }
}

// Create chat
const createChatHandler = async () => {
  try {
    const chat = await createChat({
      name: newChatName.value || undefined,
      user_id: userId
    })
    showCreateChatModal.value = false
    newChatName.value = ''
    await loadChats()
    await selectChat(chat.id)
  } catch (error) {
    console.error('Error creating chat:', error)
    alert('Failed to create chat')
  }
}

// Update chat name
const updateChatName = async () => {
  if (!selectedChat.value) return
  try {
    await updateChat(selectedChat.value, { name: chatName.value })
    await loadChats()
  } catch (error) {
    console.error('Error updating chat:', error)
  }
}

// Delete chat
const deleteChatHandler = async (chatId: string) => {
  if (!confirm('Are you sure you want to delete this chat?')) return
  try {
    await deleteChat(chatId)
    await loadChats()
    if (selectedChat.value === chatId) {
      selectedChat.value = null
      currentChat.value = null
    }
  } catch (error) {
    console.error('Error deleting chat:', error)
    alert('Failed to delete chat')
  }
}

// Add agent
const addAgentHandler = async () => {
  if (!selectedChat.value) return
  try {
    await createAgent(selectedChat.value, {
      name: newAgentName.value || undefined,
      chat_id: selectedChat.value
    })
    showAddAgentModal.value = false
    newAgentName.value = ''
    await selectChat(selectedChat.value)
  } catch (error) {
    console.error('Error adding agent:', error)
    alert('Failed to add agent')
  }
}

// Delete agent
const deleteAgentHandler = async (agentId: string) => {
  if (!confirm('Are you sure you want to delete this agent?')) return
  if (!selectedChat.value) return
  try {
    await deleteAgent(agentId)
    await selectChat(selectedChat.value)
  } catch (error: any) {
    console.error('Error deleting agent:', error)
    alert(error.message || 'Failed to delete agent')
  }
}

// Add round
const addRoundHandler = async () => {
  if (!selectedChat.value || !currentChat.value) return
  try {
    const responses = currentChat.value.agents.map(agent => ({
      agent_id: agent.id,
      response_text: newRoundResponses.value[agent.id] || ''
    }))

    await createRound(selectedChat.value, {
      chat_id: selectedChat.value,
      prompt: newRoundPrompt.value,
      responses
    })
    showAddRoundModal.value = false
    newRoundPrompt.value = ''
    newRoundResponses.value = {}
    await selectChat(selectedChat.value)
  } catch (error) {
    console.error('Error adding round:', error)
    alert('Failed to add round')
  }
}

// Delete round
const deleteRoundHandler = async (roundId: string) => {
  if (!confirm('Are you sure you want to delete this round?')) return
  if (!selectedChat.value) return
  try {
    await deleteRound(selectedChat.value, roundId)
    await selectChat(selectedChat.value)
  } catch (error) {
    console.error('Error deleting round:', error)
    alert('Failed to delete round')
  }
}

// Update round prompt
const updateRoundPrompt = async (roundId: string, prompt: string) => {
  if (!selectedChat.value) return
  try {
    await updateRound(selectedChat.value, roundId, { prompt })
    await selectChat(selectedChat.value)
  } catch (error) {
    console.error('Error updating round prompt:', error)
  }
}

// Update round response
const updateRoundResponse = async (roundId: string, agentId: string, responseText: string) => {
  if (!selectedChat.value || !currentChat.value) return
  try {
    const round = currentChat.value.rounds.find(r => r.id === roundId)
    if (!round) return

    const responses = round.responses.map(r =>
      r.agent_id === agentId ? { ...r, response_text: responseText } : r
    )

    await updateRound(selectedChat.value, roundId, {
      responses: responses.map(r => ({
        agent_id: r.agent_id,
        response_text: r.response_text
      }))
    })
    await selectChat(selectedChat.value)
  } catch (error) {
    console.error('Error updating round response:', error)
  }
}

// Count tokens helper
const countTokensInText = (text: string): number => {
  return countTokens(text || '', 'gpt-4')
}
</script>

