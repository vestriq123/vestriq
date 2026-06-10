type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private isDev = process.env.NODE_ENV !== "production";

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  public info(message: string, meta?: Record<string, unknown>) {
    console.info(this.formatMessage("info", message, meta));
  }

  public warn(message: string, meta?: Record<string, unknown>) {
    console.warn(this.formatMessage("warn", message, meta));
  }

  public error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const errDetails = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    const combinedMeta = { ...meta, error: errDetails as Record<string, unknown> | undefined };
    console.error(this.formatMessage("error", message, combinedMeta as Record<string, unknown>));
  }

  public debug(message: string, meta?: Record<string, unknown>) {
    if (this.isDev) {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }
}

export const logger = new Logger();
export default logger;
