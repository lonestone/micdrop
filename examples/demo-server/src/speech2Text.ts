import { GladiaSTT } from '@micdrop/gladia'
import { OpenaiSTT } from '@micdrop/openai'
import { MockSTT } from '@micdrop/server'

export default {
  // Mock
  mock: () => new MockSTT(),

  // Gladia
  gladia: () =>
    new GladiaSTT({
      apiKey: process.env.GLADIA_API_KEY || '',
      settings: {
        realtime_processing: {
          custom_vocabulary: true,
          custom_vocabulary_config: {
            vocabulary: ['Micdrop'],
          },
        },
      },
    }),

  // OpenAI
  openai: () =>
    new OpenaiSTT({
      apiKey: process.env.OPENAI_API_KEY || '',
    }),
}
