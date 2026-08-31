/**
 * Runs one inference at a time, whichever model asks.
 *
 * The ONNX runtime keeps a single active session for the whole WebAssembly
 * module, so two models cannot be in flight together. On the WebAssembly
 * backend each run finishes before the next task gets a turn and nothing
 * collides, but a graphics card run yields while it waits for the device: the
 * voice activity detector then scores its next window on top of it and both
 * fail, one with `Session already started` and the other with `Session
 * mismatch`.
 *
 * The queue lives on the global scope so that every Micdrop model takes the
 * same turns, including the Silero detector, which ships in another package
 * and cannot import this one.
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
