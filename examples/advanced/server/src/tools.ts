import { Agent, MicdropServer } from '@micdrop/server'
import { z } from 'zod'

/**
 * The tools the demo can hand to the agent, ticked in the client.
 *
 * Each one is registered only when the client asks for it, so a model can be
 * tried with a single tool, or with none, to see how many it juggles before
 * it starts picking the wrong one.
 */
export type ToolName = 'get_time' | 'get_weather' | 'say_something_later'

export const DEFAULT_TOOLS: Record<ToolName, boolean> = {
  get_time: true,
  get_weather: true,
  say_something_later: true,
}

/** What the client sends when it starts a call, all of them optional. */
export type ToolSelection = Partial<Record<ToolName, boolean>>

type AddTool = (server: MicdropServer, agent: Agent) => void

const TOOLS: Record<ToolName, AddTool> = {
  // Get time
  get_time: (_server, agent) =>
    agent.addTool({
      name: 'get_time',
      description: 'Get the current time',
      execute: () => new Date().toLocaleTimeString(),
    }),

  // Get weather
  get_weather: (_server, agent) =>
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
    }),

  // Speak on a timer, after the turn that asked for it
  say_something_later: (server, agent) =>
    agent.addTool({
      name: 'say_something_later',
      description:
        'Say something later (can be used as an alarm clock or reminder)',
      inputSchema: z.object({
        message: z.string().describe('The message to say'),
        delay: z.number().describe('The delay in seconds'),
      }),
      execute: async ({ message, delay }) => {
        setTimeout(() => {
          agent.addAssistantMessage(message)
          server.speak(message)
        }, delay * 1000)
        return { success: true }
      },
    }),
}

export function addTools(
  server: MicdropServer,
  agent: Agent,
  selection: ToolSelection = {}
): ToolName[] {
  const enabled = { ...DEFAULT_TOOLS, ...selection }
  const names = (Object.keys(TOOLS) as ToolName[]).filter(
    (name) => enabled[name]
  )
  for (const name of names) TOOLS[name](server, agent)
  return names
}
