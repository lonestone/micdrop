export class Logger {
  // Enable debug logging
  private lastDebug = Date.now()

  constructor(private readonly name: string) {}

  log(...message: any[]) {
    const now = Date.now()
    const delta = now - this.lastDebug
    this.lastDebug = now
    console.log(`[${this.name} +${delta}ms]`, ...message)
  }
}
