<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Emissions Over Time Chart -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        CO₂ Emissions Over Time
      </h3>
      <div ref="emissionsChartRef" class="h-64"></div>
    </div>

    <!-- Energy Consumption Chart -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Energy Consumption Over Time
      </h3>
      <div ref="energyChartRef" class="h-64"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { Calculation } from '~/types/watttime'

interface Props {
  calculations: readonly Calculation[]
}

const props = defineProps<Props>()

const emissionsChartRef = ref<HTMLElement | null>(null)
const energyChartRef = ref<HTMLElement | null>(null)

let emissionsChart: any = null
let energyChart: any = null

function renderEmissionsChart() {
  if (!emissionsChartRef.value || props.calculations.length === 0) return

  // Clear existing chart
  d3.select(emissionsChartRef.value).selectAll('*').remove()

  const margin = { top: 20, right: 20, bottom: 40, left: 60 }
  const width = emissionsChartRef.value.clientWidth - margin.left - margin.right
  const height = 256 - margin.top - margin.bottom

  const svg = d3
    .select(emissionsChartRef.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Prepare data - group by date
  const data = props.calculations
    .map((calc) => ({
      date: new Date(calc.created_at),
      value: calc.results.totalEmissionsGrams,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (data.length === 0) return

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date) as [Date, Date])
    .range([0, width])

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) || 0])
    .nice()
    .range([height, 0])

  // Line generator
  const line = d3
    .line<{ date: Date; value: number }>()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX)

  // Add line
  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#ef4444')
    .attr('stroke-width', 2)
    .attr('d', line)

  // Add dots
  g.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d) => xScale(d.date))
    .attr('cy', (d) => yScale(d.value))
    .attr('r', 4)
    .attr('fill', '#ef4444')

  // Add axes
  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%m/%d') as any)
  const yAxis = d3.axisLeft(yScale).ticks(5)

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', '#6b7280')

  g.append('g').call(yAxis).selectAll('text').style('fill', '#6b7280')

  // Add axis labels
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', '#6b7280')
    .style('font-size', '12px')
    .text('CO₂ (g)')

  emissionsChart = { svg, g }
}

function renderEnergyChart() {
  if (!energyChartRef.value || props.calculations.length === 0) return

  // Clear existing chart
  d3.select(energyChartRef.value).selectAll('*').remove()

  const margin = { top: 20, right: 20, bottom: 40, left: 60 }
  const width = energyChartRef.value.clientWidth - margin.left - margin.right
  const height = 256 - margin.top - margin.bottom

  const svg = d3
    .select(energyChartRef.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Prepare data
  const data = props.calculations
    .map((calc) => ({
      date: new Date(calc.created_at),
      value: calc.results.energyJoules / 3600000, // Convert to kWh
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (data.length === 0) return

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date) as [Date, Date])
    .range([0, width])

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value) || 0])
    .nice()
    .range([height, 0])

  // Line generator
  const line = d3
    .line<{ date: Date; value: number }>()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX)

  // Add line
  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#3b82f6')
    .attr('stroke-width', 2)
    .attr('d', line)

  // Add dots
  g.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (d) => xScale(d.date))
    .attr('cy', (d) => yScale(d.value))
    .attr('r', 4)
    .attr('fill', '#3b82f6')

  // Add axes
  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%m/%d') as any)
  const yAxis = d3.axisLeft(yScale).ticks(5)

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', '#6b7280')

  g.append('g').call(yAxis).selectAll('text').style('fill', '#6b7280')

  // Add axis labels
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', '#6b7280')
    .style('font-size', '12px')
    .text('Energy (kWh)')

  energyChart = { svg, g }
}

watch(() => props.calculations, () => {
  renderEmissionsChart()
  renderEnergyChart()
}, { deep: true })

onMounted(() => {
  setTimeout(() => {
    renderEmissionsChart()
    renderEnergyChart()
  }, 100)
})

onUnmounted(() => {
  if (emissionsChart) {
    emissionsChart.svg.remove()
  }
  if (energyChart) {
    energyChart.svg.remove()
  }
})
</script>

