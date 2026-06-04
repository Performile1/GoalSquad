/**
 * Structured JSON Logger
 * Provides structured, searchable logging for production debugging
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  userId?: string;
  orderId?: string;
  merchantId?: string;
  warehouseId?: string;
  requestId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private static instance: Logger;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private format(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    return entry;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry = this.format(level, message, context, error);
    
    if (this.isDevelopment) {
      // Pretty print in development
      const emoji = {
        [LogLevel.DEBUG]: '🔍',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.ERROR]: '❌',
      };
      console.log(`${emoji[level]} [${level.toUpperCase()}]`, message, context || '', error || '');
    } else {
      // JSON in production
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Convenience methods for common scenarios
  apiError(method: string, path: string, error: Error, context?: LogContext): void {
    this.error(`API Error: ${method} ${path}`, error, {
      ...context,
      method,
      path,
    });
  }

  dbError(operation: string, table: string, error: Error, context?: LogContext): void {
    this.error(`DB Error: ${operation} on ${table}`, error, {
      ...context,
      operation,
      table,
    });
  }

  paymentError(operation: string, paymentId: string, error: Error, context?: LogContext): void {
    this.error(`Payment Error: ${operation} for ${paymentId}`, error, {
      ...context,
      operation,
      paymentId,
    });
  }

  webhookError(eventType: string, error: Error, context?: LogContext): void {
    this.error(`Webhook Error: ${eventType}`, error, {
      ...context,
      eventType,
    });
  }
}

export const logger = Logger.getInstance();
