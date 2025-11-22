import { Injectable } from '@nestjs/common';
import type { LoggerModuleOptions } from './type';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

// Single enum for all colors
export enum LogColors {
  // Basic colors
  RED = '\x1b[31m',
  GREEN = '\x1b[32m',
  YELLOW = '\x1b[33m',
  BLUE = '\x1b[34m',
  MAGENTA = '\x1b[35m',
  CYAN = '\x1b[36m',
  WHITE = '\x1b[37m',
  GRAY = '\x1b[90m',
  
  // Formatting
  RESET = '\x1b[0m',
  BOLD = '\x1b[1m',
  DIM = '\x1b[2m',
}

@Injectable()
export class LoggerService {
  private readonly config: Required<LoggerModuleOptions>;
  private readonly logLevel: LogLevel;
  private currentFileSize: number = 0;
  private readonly maxFileSizeBytes: number;

  // Map log levels to colors
  private readonly levelColors = {
    [LogLevel.ERROR]: LogColors.RED,
    [LogLevel.WARN]: LogColors.YELLOW,
    [LogLevel.INFO]: LogColors.GREEN,
    [LogLevel.DEBUG]: LogColors.BLUE,
    [LogLevel.VERBOSE]: LogColors.GRAY,
  };

  // Map string levels to LogLevel enum
  private readonly stringToLogLevel = {
    'error': LogLevel.ERROR,
    'warn': LogLevel.WARN,
    'info': LogLevel.INFO,
    'debug': LogLevel.DEBUG,
    'verbose': LogLevel.VERBOSE,
  };

  constructor(options: LoggerModuleOptions) {
    this.config = {
      moduleName: options.moduleName,
      enabled: options.enabled ?? true,
      logLevel: options.logLevel || 'info',
      enableFileLogging: options.enableFileLogging ?? false,
      logFilePath: options.logFilePath || `./logs/${options.moduleName}.log`,
      timestampFormat: options.timestampFormat || 'YYYY-MM-DD HH:mm:ss.SSS',
      useColors: options.useColors ?? true,
      maxFileSize: options.maxFileSize || '10m',
      maxFiles: options.maxFiles || 5,
      logFormat: options.logFormat || 'text',
    };

    this.logLevel = this.stringToLogLevel[this.config.logLevel];
    this.maxFileSizeBytes = this.parseFileSize(this.config.maxFileSize);
    
    if (this.config.enabled && this.config.enableFileLogging) {
      this.ensureLogDirectory();
      this.initializeFileSize();
    }
  }

  private parseFileSize(size: string): number {
    const units: { [key: string]: number } = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+)([bkmg])?$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB

    const value = parseInt(match[1]);
    const unit = match[2] || 'b';
    
    return value * (units[unit] || 1);
  }

  private ensureLogDirectory(): void {
    if (this.config.enableFileLogging) {
      const dir = path.dirname(this.config.logFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private initializeFileSize(): void {
    if (this.config.enableFileLogging && fs.existsSync(this.config.logFilePath)) {
      try {
        const stats = fs.statSync(this.config.logFilePath);
        this.currentFileSize = stats.size;
      } catch (error) {
        this.currentFileSize = 0;
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').split('.')[0] + '.' + 
           now.getMilliseconds().toString().padStart(3, '0');
  }

  private colorize(message: string, color: LogColors): string {
    return this.config.useColors ? `${color}${message}${LogColors.RESET}` : message;
  }

  private getLevelColor(level: LogLevel): LogColors {
    return this.levelColors[level] || LogColors.WHITE;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): any {
    const timestamp = this.getTimestamp();
    const levelName = LogLevel[level].toLowerCase();
    
    const logEntry = {
      timestamp,
      level: levelName.toUpperCase(),
      module: this.config.moduleName,
      context: context || 'Application',
      message,
      pid: process.pid,
    };

    if (this.config.logFormat === 'json') {
      return JSON.stringify(logEntry);
    }

    // Text format with colors
    const levelColor = this.getLevelColor(level);
    const coloredLevel = this.colorize(levelName.toUpperCase().padEnd(7), levelColor);
    const coloredModule = this.colorize(`[${this.config.moduleName}]`, LogColors.CYAN);
    const coloredContext = context ? this.colorize(`[${context}]`, LogColors.MAGENTA) : '';
    
    return `${timestamp} ${coloredLevel} ${coloredModule}${coloredContext} ${message}`;
  }

  private async writeToFile(message: string): Promise<void> {
    if (!this.config.enabled || !this.config.enableFileLogging) return;

    try {
      const logMessage = this.config.logFormat === 'json' ? message : 
                        message.replace(/\x1b\[\d+m/g, '') + '\n';
      
      // Check if we need to rotate the file
      if (this.currentFileSize + Buffer.byteLength(logMessage, 'utf8') > this.maxFileSizeBytes) {
        await this.rotateLogFile();
      }

      fs.appendFileSync(this.config.logFilePath, logMessage);
      this.currentFileSize += Buffer.byteLength(logMessage, 'utf8');
    } catch (error) {
      // Fallback to console if file writing fails
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateLogFile(): Promise<void> {
    if (!fs.existsSync(this.config.logFilePath)) return;

    try {
      const dir = path.dirname(this.config.logFilePath);
      const filename = path.basename(this.config.logFilePath, path.extname(this.config.logFilePath));
      const ext = path.extname(this.config.logFilePath);

      // Rotate existing files
      for (let i = this.config.maxFiles - 1; i > 0; i--) {
        const oldFile = path.join(dir, `${filename}.${i}${ext}`);
        const newFile = path.join(dir, `${filename}.${i + 1}${ext}`);
        
        if (fs.existsSync(oldFile)) {
          if (i === this.config.maxFiles - 1) {
            // Delete the oldest file if we've reached max files
            fs.unlinkSync(oldFile);
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Rotate current file
      const firstBackup = path.join(dir, `${filename}.1${ext}`);
      fs.renameSync(this.config.logFilePath, firstBackup);
      
      this.currentFileSize = 0;
    } catch (error) {
      console.error('Log rotation failed:', error);
    }
  }

  // Public logging methods
  error(message: string, context?: string): void {
    if (!this.config.enabled) return;
    if (this.shouldLog(LogLevel.ERROR)) {
      const formatted = this.formatMessage(LogLevel.ERROR, message, context);
      console.error(formatted);
      this.writeToFile(formatted);
    }
  }

  warn(message: string, context?: string): void {
    if (!this.config.enabled) return;
    if (this.shouldLog(LogLevel.WARN)) {
      const formatted = this.formatMessage(LogLevel.WARN, message, context);
      console.warn(formatted);
      this.writeToFile(formatted);
    }
  }

  info(message: string, context?: string): void {
    if (!this.config.enabled) return;
    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatMessage(LogLevel.INFO, message, context);
      console.log(formatted);
      this.writeToFile(formatted);
    }
  }

  debug(message: string, context?: string): void {
    if (!this.config.enabled) return;
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formatted = this.formatMessage(LogLevel.DEBUG, message, context);
      console.log(formatted);
      this.writeToFile(formatted);
    }
  }

  verbose(message: string, context?: string): void {
    if (!this.config.enabled) return;
    if (this.shouldLog(LogLevel.VERBOSE)) {
      const formatted = this.formatMessage(LogLevel.VERBOSE, message, context);
      console.log(formatted);
      this.writeToFile(formatted);
    }
  }

  // Dynamic logging with level parameter
  log(level: 'error' | 'warn' | 'info' | 'debug' | 'verbose', message: string, context?: string): void {
    this[level](message, context);
  }

  // Utility methods
  setLogLevel(level: 'error' | 'warn' | 'info' | 'debug' | 'verbose'): void {
    (this as any).logLevel = this.stringToLogLevel[level];
  }

  enableFileLogging(enable: boolean): void {
    (this as any).config.enableFileLogging = enable;
  }

  // Check if logger is enabled
  isEnabled(): boolean {
    return this.config.enabled;
  }
}