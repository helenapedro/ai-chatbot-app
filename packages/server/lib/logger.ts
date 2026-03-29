type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const writeLog = (level: LogLevel, message: string, context?: LogContext) => {
   const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? { context } : {}),
   };

   const serialized = JSON.stringify(entry);

   if (level === 'error') {
      console.error(serialized);
      return;
   }

   console.log(serialized);
};

export const logger = {
   info(message: string, context?: LogContext) {
      writeLog('info', message, context);
   },

   warn(message: string, context?: LogContext) {
      writeLog('warn', message, context);
   },

   error(message: string, context?: LogContext) {
      writeLog('error', message, context);
   },
};
