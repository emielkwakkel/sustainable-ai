<template>
  <div class="space-y-6">
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

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- CO2 Emissions per Tag Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          CO₂ Emissions per Tag
        </h3>
        <div ref="emissionsPerTagChartRef" class="h-64"></div>
      </div>

      <!-- Energy Consumption per Tag Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Energy Consumption per Tag
        </h3>
        <div ref="energyPerTagChartRef" class="h-64"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { Calculation, Tag } from '~/types/watttime'

interface Props {
  calculations: readonly Calculation[]
}

const props = defineProps<Props>()

const emissionsChartRef = ref<HTMLElement | null>(null)
const energyChartRef = ref<HTMLElement | null>(null)
const emissionsPerTagChartRef = ref<HTMLElement | null>(null)
const energyPerTagChartRef = ref<HTMLElement | null>(null)

let emissionsChart: any = null
let energyChart: any = null
let emissionsPerTagChart: any = null
let energyPerTagChart: any = null

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

  // Prepare data - group by 6-hour intervals
  const rawData = props.calculations
    .map((calc) => ({
      date: new Date(calc.created_at),
      value: calc.results.totalEmissionsGrams,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (rawData.length === 0) return

  // Group data by 6-hour intervals
  const groupedData = new Map<string, { date: Date; value: number; count: number }>()
  
  rawData.forEach((item) => {
    // Round down to nearest 6-hour interval
    const date = new Date(item.date)
    const hours = date.getHours()
    const roundedHours = Math.floor(hours / 6) * 6
    const roundedDate = new Date(date)
    roundedDate.setHours(roundedHours, 0, 0, 0)
    
    const key = roundedDate.toISOString()
    const existing = groupedData.get(key)
    
    if (existing) {
      existing.value += item.value
      existing.count += 1
    } else {
      groupedData.set(key, {
        date: roundedDate,
        value: item.value,
        count: 1
      })
    }
  })
  
  const data = Array.from(groupedData.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())

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
  // Format: "Nov 4 00:00" for 6-hour intervals
  const dateFormat = d3.timeFormat('%b %d %H:00')
  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(dateFormat as any)
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

  // Prepare data - group by 6-hour intervals
  const rawData = props.calculations
    .map((calc) => ({
      date: new Date(calc.created_at),
      value: calc.results.energyJoules / 3600000, // Convert to kWh
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (rawData.length === 0) return

  // Group data by 6-hour intervals
  const groupedData = new Map<string, { date: Date; value: number; count: number }>()
  
  rawData.forEach((item) => {
    // Round down to nearest 6-hour interval
    const date = new Date(item.date)
    const hours = date.getHours()
    const roundedHours = Math.floor(hours / 6) * 6
    const roundedDate = new Date(date)
    roundedDate.setHours(roundedHours, 0, 0, 0)
    
    const key = roundedDate.toISOString()
    const existing = groupedData.get(key)
    
    if (existing) {
      existing.value += item.value
      existing.count += 1
    } else {
      groupedData.set(key, {
        date: roundedDate,
        value: item.value,
        count: 1
      })
    }
  })
  
  const data = Array.from(groupedData.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())

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
  // Format: "Nov 4 00:00" for 6-hour intervals
  const dateFormat = d3.timeFormat('%b %d %H:00')
  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(dateFormat as any)
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

function renderEmissionsPerTagChart() {
  if (!emissionsPerTagChartRef.value || props.calculations.length === 0) return

  // Clear existing chart
  d3.select(emissionsPerTagChartRef.value).selectAll('*').remove()

  // Group calculations by tag
  const tagData = new Map<string, { name: string; color: string; value: number }>()
  
  props.calculations.forEach((calc) => {
    if (calc.tags && calc.tags.length > 0) {
      calc.tags.forEach((tag) => {
        const existing = tagData.get(String(tag.id))
        if (existing) {
          existing.value += calc.results.totalEmissionsGrams
        } else {
          tagData.set(String(tag.id), {
            name: tag.name,
            color: tag.color,
            value: calc.results.totalEmissionsGrams
          })
        }
      })
    } else {
      // Calculations without tags grouped as "Untagged"
      const existing = tagData.get('untagged')
      if (existing) {
        existing.value += calc.results.totalEmissionsGrams
      } else {
        tagData.set('untagged', {
          name: 'Untagged',
          color: '#9ca3af',
          value: calc.results.totalEmissionsGrams
        })
      }
    }
  })

  const data = Array.from(tagData.values()).sort((a, b) => b.value - a.value)
  
  if (data.length === 0) return

  const margin = { top: 20, right: 20, bottom: 60, left: 60 }
  const width = emissionsPerTagChartRef.value.clientWidth - margin.left - margin.right
  const height = 256 - margin.top - margin.bottom

  const svg = d3
    .select(emissionsPerTagChartRef.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = d3
    .scaleBand()
    .domain(data.map(d => d.name))
    .range([0, width])
    .padding(0.2)

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.value) || 0])
    .nice()
    .range([height, 0])

  // Add bars with hover interaction
  const bars = g.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.name) || 0)
    .attr('y', d => yScale(d.value))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d.value))
    .attr('fill', d => d.color)
    .attr('opacity', 0.8)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1)
      
      // Show tooltip
      const tooltip = g.append('g')
        .attr('class', 'tooltip')
        .attr('transform', `translate(${(xScale(d.name) || 0) + xScale.bandwidth() / 2},${yScale(d.value) - 10})`)
      
      tooltip.append('rect')
        .attr('x', -50)
        .attr('y', -20)
        .attr('width', 100)
        .attr('height', 18)
        .attr('fill', '#1f2937')
        .attr('rx', 4)
      
      tooltip.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .text(`${d.value.toFixed(2)} g`)
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.8)
      g.selectAll('.tooltip').remove()
    })

  // Add axes
  const xAxis = d3.axisBottom(xScale)
  const yAxis = d3.axisLeft(yScale).ticks(5)

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', '#6b7280')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')

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

  emissionsPerTagChart = { svg, g }
}

function renderEnergyPerTagChart() {
  if (!energyPerTagChartRef.value || props.calculations.length === 0) return

  // Clear existing chart
  d3.select(energyPerTagChartRef.value).selectAll('*').remove()

  // Group calculations by tag
  const tagData = new Map<string, { name: string; color: string; value: number }>()
  
  props.calculations.forEach((calc) => {
    if (calc.tags && calc.tags.length > 0) {
      calc.tags.forEach((tag) => {
        const existing = tagData.get(String(tag.id))
        if (existing) {
          existing.value += calc.results.energyJoules / 3600000 // Convert to kWh
        } else {
          tagData.set(String(tag.id), {
            name: tag.name,
            color: tag.color,
            value: calc.results.energyJoules / 3600000
          })
        }
      })
    } else {
      // Calculations without tags grouped as "Untagged"
      const existing = tagData.get('untagged')
      if (existing) {
        existing.value += calc.results.energyJoules / 3600000
      } else {
        tagData.set('untagged', {
          name: 'Untagged',
          color: '#9ca3af',
          value: calc.results.energyJoules / 3600000
        })
      }
    }
  })

  const data = Array.from(tagData.values()).sort((a, b) => b.value - a.value)
  
  if (data.length === 0) return

  const margin = { top: 20, right: 20, bottom: 60, left: 60 }
  const width = energyPerTagChartRef.value.clientWidth - margin.left - margin.right
  const height = 256 - margin.top - margin.bottom

  const svg = d3
    .select(energyPerTagChartRef.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = d3
    .scaleBand()
    .domain(data.map(d => d.name))
    .range([0, width])
    .padding(0.2)

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.value) || 0])
    .nice()
    .range([height, 0])

  // Add bars with hover interaction
  const bars = g.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.name) || 0)
    .attr('y', d => yScale(d.value))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d.value))
    .attr('fill', d => d.color)
    .attr('opacity', 0.8)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1)
      
      // Show tooltip
      const tooltip = g.append('g')
        .attr('class', 'tooltip')
        .attr('transform', `translate(${(xScale(d.name) || 0) + xScale.bandwidth() / 2},${yScale(d.value) - 10})`)
      
      tooltip.append('rect')
        .attr('x', -50)
        .attr('y', -20)
        .attr('width', 100)
        .attr('height', 18)
        .attr('fill', '#1f2937')
        .attr('rx', 4)
      
      tooltip.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .text(`${d.value.toFixed(4)} kWh`)
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.8)
      g.selectAll('.tooltip').remove()
    })

  // Add axes
  const xAxis = d3.axisBottom(xScale)
  const yAxis = d3.axisLeft(yScale).ticks(5)

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', '#6b7280')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')

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

  energyPerTagChart = { svg, g }
}

watch(() => props.calculations, () => {
  renderEmissionsChart()
  renderEnergyChart()
  renderEmissionsPerTagChart()
  renderEnergyPerTagChart()
}, { deep: true })

onMounted(() => {
  setTimeout(() => {
    renderEmissionsChart()
    renderEnergyChart()
    renderEmissionsPerTagChart()
    renderEnergyPerTagChart()
  }, 100)
})

onUnmounted(() => {
  if (emissionsChart) {
    emissionsChart.svg.remove()
  }
  if (energyChart) {
    energyChart.svg.remove()
  }
  if (emissionsPerTagChart) {
    emissionsPerTagChart.svg.remove()
  }
  if (energyPerTagChart) {
    energyPerTagChart.svg.remove()
  }
})
</script>

