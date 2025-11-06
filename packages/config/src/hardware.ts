import type { HardwareConfig } from '@susai/types'

// Hardware configurations
export const hardwareConfigs: HardwareConfig[] = [
  {
    id: 'nvidia-a100',
    name: 'NVIDIA A100',
    powerConsumption: 400,
    tokensPerSecond: 1400,
    efficiency: 3.5
  },
  {
    id: 'nvidia-v100',
    name: 'NVIDIA V100',
    powerConsumption: 300,
    tokensPerSecond: 800,
    efficiency: 2.67
  },
  {
    id: 'nvidia-h100',
    name: 'NVIDIA H100',
    powerConsumption: 700,
    tokensPerSecond: 2000,
    efficiency: 2.86
  },
  {
    id: 'tpu-v4',
    name: 'Google TPU v4',
    powerConsumption: 200,
    tokensPerSecond: 1000,
    efficiency: 5.0
  }
]

export const getHardwareConfigById = (id: string): HardwareConfig | undefined => {
  return hardwareConfigs.find(hardware => hardware.id === id)
}

