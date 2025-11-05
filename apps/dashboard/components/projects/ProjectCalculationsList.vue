<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <input
            type="checkbox"
            :checked="allSelected"
            :indeterminate="someSelected"
            @change="handleSelectAll"
            class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Calculations
            <span v-if="totalCount > 0" class="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({{ totalCount }})
            </span>
          </h3>
        </div>
        <div v-if="selectedCalculations.length > 0" class="flex items-center gap-2">
          <button
            @click="showTagModal = true"
            class="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            <TagIcon class="w-4 h-4" />
            Tag Selected ({{ selectedCalculations.length }})
          </button>
          <button
            @click="handleBulkDelete"
            :disabled="deleting"
            class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 v-if="!deleting" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            Delete Selected
          </button>
          <button
            @click="handleBulkRecalculate"
            :disabled="recalculating"
            class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Loader2 v-if="recalculating" class="w-4 h-4 animate-spin" />
            <RefreshCw v-else class="w-4 h-4" />
            Recalculate Selected
          </button>
        </div>
      </div>
    </div>
    <div class="p-6">
      <div v-if="calculations.length > 0" class="space-y-4">
        <div
          v-for="calculation in calculations"
          :key="calculation.id"
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div class="flex items-center space-x-4 flex-1">
            <input
              type="checkbox"
              :value="calculation.id"
              v-model="selectedCalculations"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Calculator class="w-5 h-5 text-blue-600" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ calculation.token_count.toLocaleString() }} tokens
                </p>
                <button
                  @click="handleEdit(calculation)"
                  class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  title="Edit"
                >
                  <Edit class="w-4 h-4" />
                </button>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {{ calculation.model }} • {{ formatDate(calculation.created_at) }}
              </p>
              <div v-if="calculation.tags && calculation.tags.length > 0" class="flex flex-wrap gap-1">
                <span
                  v-for="tag in calculation.tags"
                  :key="tag.id"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :style="{ backgroundColor: tag.color + '20', color: tag.color }"
                >
                  {{ tag.name }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="font-medium text-red-600 dark:text-red-400">
                {{ formatCO2(calculation.results.totalEmissionsGrams) }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatEnergy(calculation.results.energyJoules) }}
              </p>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="handleRecalculate(String(calculation.id))"
                :disabled="recalculating"
                class="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                title="Recalculate"
              >
                <Loader2 v-if="recalculating" class="w-4 h-4 animate-spin" />
                <RefreshCw v-else class="w-4 h-4" />
              </button>
              <button
                @click="handleDelete(String(calculation.id))"
                :disabled="deleting"
                class="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
        <Calculator class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No calculations yet</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalCount > pageSize" class="mt-6 flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Showing {{ Math.min(currentPage * pageSize - pageSize + 1, totalCount) }} to
          {{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }} results
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div class="flex items-center gap-1">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'px-3 py-2 text-sm rounded-lg',
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              ]"
            >
              {{ page }}
            </button>
          </div>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Tag Assignment Modal -->
    <TagAssignmentModal
      v-if="showTagModal"
      :project-id="projectId"
      :calculation-ids="selectedCalculations"
      @close="showTagModal = false"
      @assigned="handleTagsAssigned"
    />

    <!-- Edit Calculation Modal -->
    <EditCalculationModal
      v-if="editingCalculation"
      :calculation="editingCalculation"
      :project-id="projectId"
      @close="editingCalculation = null"
      @updated="handleCalculationUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Calculator, RefreshCw, Loader2, Trash2, Edit, Tag as TagIcon } from 'lucide-vue-next'
import type { Calculation, Tag } from '~/types/watttime'
import { formatCO2, formatEnergy } from '~/utils/formatting'
import TagAssignmentModal from './TagAssignmentModal.vue'
import EditCalculationModal from './EditCalculationModal.vue'

interface Props {
  calculations: readonly Calculation[]
  totalCount: number
  currentPage: number
  pageSize: number
  projectId: string
}

interface Emits {
  (e: 'recalculated'): void
  (e: 'deleted'): void
  (e: 'page-change', page: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedCalculations = ref<string[]>([])
const recalculating = ref(false)
const deleting = ref(false)
const showTagModal = ref(false)
const editingCalculation = ref<Calculation | null>(null)

const allSelected = computed(() => {
  return props.calculations.length > 0 && selectedCalculations.value.length === props.calculations.length
})

const someSelected = computed(() => {
  return selectedCalculations.value.length > 0 && selectedCalculations.value.length < props.calculations.length
})

const totalPages = computed(() => Math.ceil(props.totalCount / props.pageSize))

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const handleSelectAll = () => {
  if (allSelected.value) {
    selectedCalculations.value = []
  } else {
    selectedCalculations.value = props.calculations.map(c => String(c.id))
  }
}

const handleRecalculate = async (calculationId: string) => {
  recalculating.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/calculations/${calculationId}/recalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'default-user',
      }),
    })

    const data = await response.json()
    if (data.success) {
      emit('recalculated')
    }
  } catch (error) {
    console.error('Error recalculating:', error)
  } finally {
    recalculating.value = false
  }
}

const handleBulkRecalculate = async () => {
  if (selectedCalculations.value.length === 0) return

  recalculating.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/calculations/bulk-recalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calculation_ids: selectedCalculations.value.map(id => parseInt(id)),
        user_id: 'default-user',
      }),
    })

    const data = await response.json()
    if (data.success) {
      selectedCalculations.value = []
      emit('recalculated')
    }
  } catch (error) {
    console.error('Error bulk recalculating:', error)
  } finally {
    recalculating.value = false
  }
}

const handleDelete = async (calculationId: string) => {
  if (!confirm('Are you sure you want to delete this calculation?')) return

  deleting.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/calculations/${calculationId}?user_id=default-user`, {
      method: 'DELETE',
    })

    const data = await response.json()
    if (data.success) {
      emit('deleted')
    }
  } catch (error) {
    console.error('Error deleting calculation:', error)
  } finally {
    deleting.value = false
  }
}

const handleBulkDelete = async () => {
  if (selectedCalculations.value.length === 0) return
  if (!confirm(`Are you sure you want to delete ${selectedCalculations.value.length} calculation(s)?`)) return

  deleting.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/calculations/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calculation_ids: selectedCalculations.value.map(id => parseInt(id)),
        user_id: 'default-user',
      }),
    })

    const data = await response.json()
    if (data.success) {
      selectedCalculations.value = []
      emit('deleted')
    }
  } catch (error) {
    console.error('Error bulk deleting:', error)
  } finally {
    deleting.value = false
  }
}

const handleEdit = (calculation: Calculation) => {
  editingCalculation.value = calculation
}

const handleCalculationUpdated = () => {
  editingCalculation.value = null
  emit('recalculated')
}

const handleTagsAssigned = () => {
  showTagModal.value = false
  selectedCalculations.value = []
  emit('recalculated')
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('page-change', page)
  }
}
</script>
