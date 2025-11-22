export interface LoggerModuleOptions {
  moduleName: string;
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  enableFileLogging?: boolean;
  logFilePath?: string;
  enabled?: boolean;
  timestampFormat?: string;
  useColors?: boolean;
  maxFileSize?: string;
  maxFiles?: number;
  logFormat?: 'json' | 'text';
}