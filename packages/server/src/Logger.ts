export class Logger {
  constructor(private readonly name: string) {}

  log(...message: any[]) {
    const time = process.uptime().toFixed(3)
    console.log(`[${this.name} ${time}]`, ...message)
  }
}
