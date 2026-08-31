import { SmartTurn } from '@micdrop/smart-turn'
import { NodeSmartTurnModel } from '@micdrop/smart-turn/node'

// The checkpoint is a few megabytes, so it is loaded once and every call
// shares it. Only the audio of a turn is per call.
let model: NodeSmartTurnModel | undefined

/**
 * Turn detection for one call, weighed on this server.
 *
 * The browser does the same job without the round trip, so this is here to be
 * compared against it rather than to be the default.
 */
export async function createSmartTurn(): Promise<SmartTurn> {
  if (!model) {
    model = new NodeSmartTurnModel()
    await model.load()
  }
  return new SmartTurn({ model })
}
