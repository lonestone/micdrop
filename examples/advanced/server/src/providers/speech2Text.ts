import { GladiaSTT } from '@micdrop/gladia'
import { GradiumSTT } from '@micdrop/gradium'
import { MistralSTT } from '@micdrop/mistral'
import { OpenaiSTT } from '@micdrop/openai'
import { FallbackSTT, MockSTT, STT } from '@micdrop/server'
import { WHISPER_MODEL_INFO, WhisperSTT } from '@micdrop/whisper'
import { ProviderRegistry } from './types'

const speech2Text: ProviderRegistry<STT> = {
  mock: {
    label: 'Mock',
    description: 'Canned transcripts, no model called',
    create: () => new MockSTT(),
  },

  gladia: {
    label: 'Gladia',
    requiredEnv: ['GLADIA_API_KEY'],
    create: () =>
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
  },

  openai: {
    label: 'OpenAI',
    requiredEnv: ['OPENAI_API_KEY'],
    create: () =>
      new OpenaiSTT({
        apiKey: process.env.OPENAI_API_KEY || '',
      }),
  },

  mistral: {
    label: 'Mistral',
    requiredEnv: ['MISTRAL_API_KEY'],
    create: () =>
      new MistralSTT({
        apiKey: process.env.MISTRAL_API_KEY || '',
      }),
  },

  gradium: {
    label: 'Gradium',
    requiredEnv: ['GRADIUM_API_KEY'],
    create: () =>
      new GradiumSTT({
        apiKey: process.env.GRADIUM_API_KEY || '',
      }),
  },

  // Local: the weights are downloaded on first use and kept in the
  // Transformers.js cache, then shared by every call of the process.
  whisper: {
    label: 'Whisper',
    local: true,
    models: Object.entries(WHISPER_MODEL_INFO).map(([id, info]) => ({
      id,
      label: info.label,
      language: info.language,
    })),
    defaultModel: 'base',
    create: ({ lang, model }) =>
      new WhisperSTT({
        model,
        // Whisper wants a bare language code, the call carries a full locale
        language: lang.split('-')[0],
      }),
  },

  fallback: {
    label: 'Fallback',
    description: 'Gladia, then OpenAI',
    requiredEnv: ['GLADIA_API_KEY', 'OPENAI_API_KEY'],
    create: (context) =>
      new FallbackSTT({
        factories: [
          () => speech2Text.gladia.create(context),
          () => speech2Text.openai.create(context),
        ],
      }),
  },
}

export default speech2Text
