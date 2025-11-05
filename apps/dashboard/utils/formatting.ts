/**
 * Format CO2 emissions with appropriate units (g, kg, t)
 * @param grams - CO2 emissions in grams
 * @returns Formatted string with unit (max 2 decimals)
 */
export function formatCO2(grams: number): string {
  if (grams >= 1_000_000) {
    // 1000 kg = 1 t
    const tons = grams / 1_000_000
    return `${tons.toFixed(2)} t CO₂`
  } else if (grams >= 1000) {
    // 1000 g = 1 kg
    const kilograms = grams / 1000
    return `${kilograms.toFixed(2)} kg CO₂`
  } else {
    return `${grams.toFixed(2)} g CO₂`
  }
}

/**
 * Format energy consumption with appropriate units (Wh, kWh, gWh)
 * @param joules - Energy in joules
 * @returns Formatted string with unit (max 2 decimals)
 */
export function formatEnergy(joules: number): string {
  // Convert joules to Wh (1 Wh = 3600 J)
  const watthours = joules / 3600

  if (watthours >= 1_000_000) {
    // 1000 kWh = 1 gWh
    const gigawatthours = watthours / 1_000_000
    return `${gigawatthours.toFixed(2)} gWh`
  } else if (watthours >= 1000) {
    // 1000 Wh = 1 kWh
    const kilowatthours = watthours / 1000
    return `${kilowatthours.toFixed(2)} kWh`
  } else {
    return `${watthours.toFixed(2)} Wh`
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

