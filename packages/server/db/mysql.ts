import { AppError } from '../errors/app-error.js';
import { database, pool } from './pool.js';

const createConnectionError = (error: unknown) =>
   new AppError('Failed to connect to the database.', 500, {
      cause: error instanceof Error ? error.message : 'Unknown database error',
   });

export const initializeDatabase = async () => {
   try {
      await pool.query('SELECT 1');
   } catch (error) {
      throw createConnectionError(error);
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
