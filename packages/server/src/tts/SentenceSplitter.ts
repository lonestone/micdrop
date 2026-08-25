/**
 * Cuts a stream of text into sentences as it arrives.
 *
 * Providers that synthesize a whole input at once need complete sentences, and
 * an agent writes its answer token by token. Feeding every fragment as it comes
 * would either cut words in half or wait for the end of the answer, so the text
 * is buffered until a sentence closes and released the moment it does.
 *
 * The splitter is stateful: `push` returns the sentences that are complete,
 * `flush` returns whatever is left when the stream ends.
 */
export class SentenceSplitter {
  private buffer = ''

  /** Adds text and returns the sentences it completes. */
  push(text: string): string[] {
    this.buffer += text
    return this.extract(false)
  }

  /** Returns the sentences left in the buffer and empties it. */
  flush(): string[] {
    const sentences = this.extract(true)
    const rest = this.buffer.trim()
    this.buffer = ''
    if (rest) sentences.push(rest)
    return sentences
  }

  /** Drops the buffered text, used when an utterance is cancelled. */
  reset() {
    this.buffer = ''
  }

  private extract(end: boolean): string[] {
    const sentences: string[] = []
    const regex = /[\s\S]*?[.!?…\n]+(?=\s|$)/g
    let match: RegExpExecArray | null
    let lastIndex = 0

    while ((match = regex.exec(this.buffer)) !== null) {
      // A sentence ending at the very end of an unfinished stream may still
      // grow, so keep it buffered until more text arrives or the stream ends.
      if (!end && regex.lastIndex === this.buffer.length) break
      const sentence = match[0].trim()
      if (sentence) sentences.push(sentence)
      lastIndex = regex.lastIndex
    }

    this.buffer = this.buffer.slice(lastIndex)
    return sentences
  }
}
