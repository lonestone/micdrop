import { Readable } from 'stream'

const defaultText =
  'Micdrop is a set of packages that simplify voice conversations with AI systems. It handles all the complexities of microphone input, speaker output, and network communication, allowing developers to focus on their AI implementation.'
const defaultDelayBetweenWords = 50

// Create stream with 100ms delay between each word
async function* wordStream(text: string, delayBetweenWords: number) {
  for (const word of text.split(' ')) {
    yield word + ' '
    await new Promise((resolve) => setTimeout(resolve, delayBetweenWords))
  }
}

export function createTextStream(
  text = defaultText,
  delayBetweenWords = defaultDelayBetweenWords
) {
  return Readable.from(wordStream(text, delayBetweenWords))
}
