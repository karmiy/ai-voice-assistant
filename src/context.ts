/**
 * Application context that provides shared services and utilities
 */

/**
 * Simple logger interface
 */
interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  tags(tag: string): Logger;
}

/**
 * Logger implementation
 */
class AppLogger implements Logger {
  constructor(private _tags: string[] = []) {}

  /**
   * Create a new logger with the given tag
   */
  tags(tag: string): Logger {
    return new AppLogger([...this._tags, tag]);
  }

  /**
   * Format log message with tags
   */
  private _formatMessage(message: string): string {
    if (this._tags.length === 0) {
      return message;
    }
    return `${this._tags.join(' ')} ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    console.debug(this._formatMessage(message), ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(this._formatMessage(message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this._formatMessage(message), ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(this._formatMessage(message), ...args);
  }
}

/**
 * Application context singleton
 */
const context = {
  /**
   * Application logger
   */
  logger: new AppLogger(),
};

export default context;
