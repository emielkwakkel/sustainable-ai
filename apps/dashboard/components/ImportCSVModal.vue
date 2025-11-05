<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="handleClose"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Import CSV from Cursor
          </h2>
          <button
            @click="handleClose"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- File Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select CSV File
          </label>
          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            @change="handleFileSelect"
            class="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              dark:file:bg-blue-900/20 dark:file:text-blue-300"
          />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Select a CSV file exported from Cursor with usage events
          </p>
        </div>

        <!-- Preview -->
        <div v-if="previewData.length > 0">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview (first 5 rows)
          </h3>
          <div class="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Date
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Model
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Total Tokens
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(row, index) in previewData.slice(0, 5)" :key="index">
                  <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">
                    {{ row.Date }}
                  </td>
                  <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">
                    {{ row.Model }}
                  </td>
                  <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">
                    {{ row['Total Tokens'] }}
                  </td>
                  <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">
                    {{ row.Cost }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
        </div>

        <!-- Import Result -->
        <div v-if="importResult" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 class="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Import Complete
          </h3>
          <ul class="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>Total processed: {{ importResult.totalProcessed }}</li>
            <li>Successfully imported: {{ importResult.imported }}</li>
            <li v-if="importResult.skipped > 0">Skipped (duplicates): {{ importResult.skipped }}</li>
            <li v-if="importResult.errors > 0">Errors: {{ importResult.errors }}</li>
          </ul>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button
          @click="handleClose"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          @click="handleImport"
          :disabled="!csvData || loading"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Upload v-if="!loading" class="w-4 h-4" />
          <Loader2 v-else class="w-4 h-4 animate-spin" />
          {{ loading ? 'Importing...' : 'Import' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X, Upload, Loader2 } from 'lucide-vue-next'

interface Props {
  projectId: string
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'imported'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement | null>(null)
const csvData = ref<string>('')
const previewData = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const importResult = ref<any>(null)

// Parse CSV to preview
function parseCSVPreview(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const firstLine = lines[0]
  if (!firstLine) return []
  
  const headers = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: any[] = []

  for (let i = 1; i < Math.min(lines.length, 6); i++) {
    const line = lines[i]
    if (!line) continue
    
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    const values: string[] = []
    let currentValue = ''
    let inQuotes = false

    for (let j = 0; j < trimmedLine.length; j++) {
      const char = trimmedLine[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim())

    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        const value = values[index]
        if (value !== undefined) {
          row[header] = value.replace(/^"|"$/g, '')
        }
      })
      rows.push(row)
    }
  }

  return rows
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  error.value = null
  importResult.value = null

  try {
    const text = await file.text()
    csvData.value = text
    previewData.value = parseCSVPreview(text)
  } catch (err) {
    error.value = 'Failed to read file'
    console.error('Error reading file:', err)
  }
}

const handleImport = async () => {
  if (!csvData.value) {
    error.value = 'Please select a CSV file'
    return
  }

  loading.value = true
  error.value = null
  importResult.value = null

  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/csv-import/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: props.projectId,
        csv_data: csvData.value,
        user_id: 'default-user', // TODO: Get from auth
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success) {
      importResult.value = data.data
      emit('imported')
      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)
    } else {
      throw new Error(data.error || 'Failed to import CSV')
    }
  } catch (err) {
    console.error('Error importing CSV:', err)
    error.value = err instanceof Error ? err.message : 'Failed to import CSV'
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  csvData.value = ''
  previewData.value = []
  error.value = null
  importResult.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  emit('close')
}
</script>

