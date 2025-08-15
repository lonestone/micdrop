import { Agent } from '@micdrop/server'
import { z } from 'zod'

export function addTools(agent: Agent) {
  // Get time
  agent.addTool({
    name: 'get_time',
    description: 'Get the current time',
    execute: () => new Date().toLocaleTimeString(),
  })

  // Get weather
  agent.addTool({
    name: 'get_weather',
    description:
      'Get the current weather (temperature, wind speed) for a given location',
    inputSchema: z.object({
      latitude: z.number().describe('Latitude of the location'),
      longitude: z.number().describe('Longitude of the location'),
    }),
    execute: async ({ latitude, longitude }) => {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m`
      )
      const data = (await response.json()) as any
      return {
        temperature: `${data.current.temperature_2m}°C`,
        wind_speed: `${data.current.wind_speed_10m} km/h`,
      }
    },
  })
}
