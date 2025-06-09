export abstract class Logger {
  // Enable debug logging
  public debugLog?: boolean
  private lastDebug = Date.now()

  protected log(...message: any[]) {
    if (!this.debugLog) return
    const now = Date.now()
    const delta = now - this.lastDebug
    this.lastDebug = now
    console.log(`[${this.constructor.name} +${delta}ms]`, ...message)
  }
}
