/**
 * Logger - Simple logging service
 */
export class Logger {
  constructor(prefix = "f17n355") {
    this._prefix = prefix;
    this._enabled = true;
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled) {
    this._enabled = enabled;
  }

  /**
   * Format log message with timestamp and prefix
   */
  _format(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this._prefix}] [${level}] ${message}`;
  }

  /**
   * Log info message
   */
  log(message, ...args) {
    if (!this._enabled) return;
    console.log(this._format("INFO", message), ...args);
  }

  /**
   * Log warning message
   */
  warn(message, ...args) {
    if (!this._enabled) return;
    console.warn(this._format("WARN", message), ...args);
  }

  /**
   * Log error message
   */
  error(message, error, ...args) {
    if (!this._enabled) return;
    console.error(this._format("ERROR", message), error, ...args);
  }

  /**
   * Log debug message (only in development)
   */
  debug(message, ...args) {
    if (!this._enabled) return;
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.debug(this._format("DEBUG", message), ...args);
    }
  }
}
