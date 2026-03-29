import { AppError } from '../errors/app-error';
import { backfillEncryptedMessages } from './encryption-backfill';
import { database, pool } from './pool';
import { initializeSchema } from './schema';

const createInitializationError = (error: unknown) =>
   new AppError('Failed to initialize the database.', 500, {
      cause: error instanceof Error ? error.message : 'Unknown database error',
   });

export const initializeDatabase = async () => {
   try {
      await initializeSchema();
      await backfillEncryptedMessages();
   } catch (error) {
      throw createInitializationError(error);
   }
};

const pingDatabase = async () => {
   await pool.query('SELECT 1');
};

export const checkDatabaseHealth = async () => {
   try {
      await pingDatabase();
      return true;
   } catch {
      return false;
   }
};

export { database };
