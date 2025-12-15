/**
 * Format CO2 emissions with appropriate units (mg, g, kg, t)
 * @param grams - CO2 emissions in grams (can be number or string)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with unit
 */
export function formatCO2(grams: number | string | null | undefined, decimals: number = 2): string {
  // Convert to number, handling null/undefined/string inputs
  const numGrams = typeof grams === 'string' ? parseFloat(grams) : (grams ?? 0)
  if (isNaN(numGrams)) {
    return '0 g CO₂'
  }
  const absValue = Math.abs(numGrams)
  
  if (absValue >= 1_000_000) {
    // 1000 kg = 1 t
    const tons = numGrams / 1_000_000
    return `${tons.toFixed(decimals)} t CO₂`
  } else if (absValue >= 1000) {
    // 1000 g = 1 kg
    const kilograms = numGrams / 1000
    return `${kilograms.toFixed(decimals)} kg CO₂`
  } else if (absValue >= 1) {
    return `${numGrams.toFixed(decimals)} g CO₂`
  } else {
    // Less than 1 gram, use milligrams
    const milligrams = numGrams * 1000
    return `${milligrams.toFixed(decimals)} mg CO₂`
  }
}

/**
 * Format energy consumption in joules with appropriate units (J, kJ, MJ, GJ)
 * @param joules - Energy in joules (can be number or string)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with unit
 */
export function formatEnergyJoules(joules: number | string | null | undefined, decimals: number = 2): string {
  // Convert to number, handling null/undefined/string inputs
  const numJoules = typeof joules === 'string' ? parseFloat(joules) : (joules ?? 0)
  if (isNaN(numJoules)) {
    return '0 J'
  }
  const absValue = Math.abs(numJoules)
  
  if (absValue >= 1_000_000_000) {
    // 1000 MJ = 1 GJ
    const gigajoules = numJoules / 1_000_000_000
    return `${gigajoules.toFixed(decimals)} GJ`
  } else if (absValue >= 1_000_000) {
    // 1000 kJ = 1 MJ
    const megajoules = numJoules / 1_000_000
    return `${megajoules.toFixed(decimals)} MJ`
  } else if (absValue >= 1000) {
    // 1000 J = 1 kJ
    const kilojoules = numJoules / 1000
    return `${kilojoules.toFixed(decimals)} kJ`
  } else {
    return `${numJoules.toFixed(decimals)} J`
  }
}

/**
 * Format energy consumption in watt-hours with appropriate units (Wh, kWh, MWh, GWh)
 * @param joules - Energy in joules (can be number or string)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with unit
 */
export function formatEnergyWh(joules: number | string | null | undefined, decimals: number = 2): string {
  // Convert to number, handling null/undefined/string inputs
  const numJoules = typeof joules === 'string' ? parseFloat(joules) : (joules ?? 0)
  if (isNaN(numJoules)) {
    return '0 Wh'
  }
  // Convert joules to Wh (1 Wh = 3600 J)
  const watthours = numJoules / 3600
  const absValue = Math.abs(watthours)

  if (absValue >= 1_000_000_000) {
    // 1,000,000,000 Wh = 1 GWh
    const gigawatthours = watthours / 1_000_000_000
    return `${gigawatthours.toFixed(decimals)} GWh`
  } else if (absValue >= 1_000_000) {
    // 1,000,000 Wh = 1 MWh
    const megawatthours = watthours / 1_000_000
    return `${megawatthours.toFixed(decimals)} MWh`
  } else if (absValue >= 1000) {
    // 1000 Wh = 1 kWh
    const kilowatthours = watthours / 1000
    return `${kilowatthours.toFixed(decimals)} kWh`
  } else {
    return `${watthours.toFixed(decimals)} Wh`
  }
}

/**
 * Format time duration with appropriate units (minutes, hours, days, weeks, months, years)
 * @param minutes - Duration in minutes
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with unit
 */
export function formatDuration(minutes: number, decimals: number = 1): string {
  const absValue = Math.abs(minutes)
  
  // Constants
  const MINUTES_PER_HOUR = 60
  const HOURS_PER_DAY = 24
  const DAYS_PER_WEEK = 7
  const DAYS_PER_MONTH = 30.44 // Average days per month
  const DAYS_PER_YEAR = 365.25 // Account for leap years
  
  const MINUTES_PER_DAY = MINUTES_PER_HOUR * HOURS_PER_DAY
  const MINUTES_PER_WEEK = MINUTES_PER_DAY * DAYS_PER_WEEK
  const MINUTES_PER_MONTH = MINUTES_PER_DAY * DAYS_PER_MONTH
  const MINUTES_PER_YEAR = MINUTES_PER_DAY * DAYS_PER_YEAR

  if (absValue >= MINUTES_PER_YEAR) {
    const years = minutes / MINUTES_PER_YEAR
    return `${years.toFixed(decimals)} ${years === 1 ? 'year' : 'years'}`
  } else if (absValue >= MINUTES_PER_MONTH) {
    const months = minutes / MINUTES_PER_MONTH
    return `${months.toFixed(decimals)} ${months === 1 ? 'month' : 'months'}`
  } else if (absValue >= MINUTES_PER_WEEK) {
    const weeks = minutes / MINUTES_PER_WEEK
    return `${weeks.toFixed(decimals)} ${weeks === 1 ? 'week' : 'weeks'}`
  } else if (absValue >= MINUTES_PER_DAY) {
    const days = minutes / MINUTES_PER_DAY
    return `${days.toFixed(decimals)} ${days === 1 ? 'day' : 'days'}`
  } else if (absValue >= MINUTES_PER_HOUR) {
    const hours = minutes / MINUTES_PER_HOUR
    return `${hours.toFixed(decimals)} ${hours === 1 ? 'hour' : 'hours'}`
  } else {
    return `${minutes.toFixed(decimals)} ${minutes === 1 ? 'minute' : 'minutes'}`
  }
}

/**
 * Format a number with maximum 2 decimal places
 * @param value - Number to format
 * @returns Formatted string (max 2 decimals)
 */
export function formatNumber(value: number): string {
  return value.toFixed(2)
}

/**
 * Format a number with dots as thousand separators (European style)
 * @param value - Number to format
 * @returns Formatted string with dots (e.g., 156000123 → "156.000.123")
 */
export function formatNumberWithDots(value: number): string {
  return value.toLocaleString('de-DE')
}

/**
 * Format cost/currency with appropriate units ($0.00, $1.23, $1.23K, $1.23M, $1.23B)
 * @param cost - Cost in dollars (can be number or string)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with currency symbol
 */
export function formatCost(cost: number | string | null | undefined, decimals: number = 2): string {
  // Convert to number, handling null/undefined/string inputs
  const numCost = typeof cost === 'string' ? parseFloat(cost) : (cost ?? 0)
  if (isNaN(numCost)) {
    return '$0.00'
  }
  const absValue = Math.abs(numCost)
  
  if (absValue >= 1_000_000_000) {
    // 1 billion or more
    const billions = numCost / 1_000_000_000
    return `$${billions.toFixed(decimals)}B`
  } else if (absValue >= 1_000_000) {
    // 1 million or more
    const millions = numCost / 1_000_000
    return `$${millions.toFixed(decimals)}M`
  } else if (absValue >= 1000) {
    // 1 thousand or more
    const thousands = numCost / 1000
    return `$${thousands.toFixed(decimals)}K`
  } else {
    // Less than 1000
    return `$${numCost.toFixed(decimals)}`
  }
}

