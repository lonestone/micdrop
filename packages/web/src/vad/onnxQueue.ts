/**
 * Runs one inference at a time, whichever model asks.
 *
 * The ONNX runtime keeps a single active session for the whole WebAssembly
 * module, so two models cannot be in flight together. A model running on the
 * graphics card yields while it waits for the device, and a detector scoring
 * its next window on top of it makes both fail, one with `Session already
 * started` and the other with `Session mismatch`.
 *
 * The queue lives on the global scope so every Micdrop model takes the same
 * turns, `@micdrop/smart-turn` included, which ships separately and holds the
 * same few lines.
 */
const globalScope = globalThis as typeof globalThis & {
  micdropOnnxQueue?: Promise<unknown>
}

/**
 * Waits for the models ahead in the queue, then runs
 * @param run - The inference to run once the runtime is free
 */
export function queueOnnxRun<T>(run: () => Promise<T>): Promise<T> {
  const started = (globalScope.micdropOnnxQueue ?? Promise.resolve()).then(
    run,
    run
  )
  // A failed run still lets the next one through
  globalScope.micdropOnnxQueue = started.catch(() => undefined)
  return started
}
