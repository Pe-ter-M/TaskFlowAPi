import { Module, DynamicModule } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerModuleOptions } from './type';

export interface LoggerAsyncModuleOptions {
  useFactory: (...args: any[]) => Promise<LoggerModuleOptions> | LoggerModuleOptions;
  inject?: any[];
}

@Module({})
export class LoggerModule {
  static forFeature(options: LoggerModuleOptions): DynamicModule {
    const loggerToken = `LoggerService_${options.moduleName}`;

    const loggerProvider = {
      provide: loggerToken,
      useFactory: () => {
        const configWithDefaults = LoggerModule.applyDefaults(options);
        return new LoggerService(configWithDefaults);
      },
    };

    return {
      module: LoggerModule,
      providers: [loggerProvider],
      exports: [loggerToken],
    };
  }

  static forFeatureAsync(asyncOptions: LoggerAsyncModuleOptions): DynamicModule {
    const loggerToken = `LoggerService_Async`;

    const loggerProvider = {
      provide: loggerToken,
      useFactory: async (...args: any[]) => {
        const config = await asyncOptions.useFactory(...args);
        const configWithDefaults = LoggerModule.applyDefaults(config);
        return new LoggerService(configWithDefaults);
      },
      inject: asyncOptions.inject || [],
    };

    return {
      module: LoggerModule,
      providers: [loggerProvider],
      exports: [loggerToken],
    };
  }


  private static applyDefaults(options: LoggerModuleOptions): Required<LoggerModuleOptions> {
    // Create a new object with all properties to avoid mutation
    const defaultOptions: Required<LoggerModuleOptions> = {
      moduleName: options.moduleName,
      enabled: options.enabled !== undefined ? options.enabled : true,
      logLevel: options.logLevel || 'info',
      enableFileLogging: options.enableFileLogging !== undefined ? options.enableFileLogging : false,
      logFilePath: options.logFilePath || `./logs/${options.moduleName}.log`,
      timestampFormat: options.timestampFormat || 'YYYY-MM-DD HH:mm:ss.SSS',
      useColors: options.useColors !== undefined ? options.useColors : true,
      maxFileSize: options.maxFileSize || '10m',
      maxFiles: options.maxFiles || 5,
      logFormat: options.logFormat || 'text',
    };

    return defaultOptions;
  }
}