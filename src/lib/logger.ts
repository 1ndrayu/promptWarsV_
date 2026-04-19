import { Logging } from '@google-cloud/logging';

// Initialize GCP structured logging
const logging = new Logging();
const log = logging.log('nexus-portal-events');

export const structuredLogger = {
  info: (message: string, metadata: Record<string, unknown> = {}) => {
    const entry = log.entry({ resource: { type: 'global' } }, { message, ...metadata });
    log.write(entry).catch(console.error);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, metadata);
    }
  },
  error: (message: string, error: unknown, metadata: Record<string, unknown> = {}) => {
    const entry = log.entry({ severity: 'ERROR', resource: { type: 'global' } }, { message, error, ...metadata });
    log.write(entry).catch(console.error);
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] ${message}`, error, metadata);
    }
  },
  warn: (message: string, metadata: Record<string, unknown> = {}) => {
    const entry = log.entry({ severity: 'WARNING', resource: { type: 'global' } }, { message, ...metadata });
    log.write(entry).catch(console.error);
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, metadata);
    }
  }
};
