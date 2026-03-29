import type { RowDataPacket } from 'mysql2';

import { logger } from '../lib/logger.js';
import { migrations } from './migrations/index.js';
import { pool } from './pool.js';

type SchemaMigrationRow = RowDataPacket & {
   name: string;
};

const createSchemaMigrationsTable = async () => {
   await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
         name VARCHAR(255) NOT NULL PRIMARY KEY,
         applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
   `);
};

const getAppliedMigrationNames = async () => {
   const [rows] = await pool.query<SchemaMigrationRow[]>(
      'SELECT name FROM schema_migrations'
   );

   return new Set(rows.map((row) => row.name));
};

const markMigrationAsApplied = async (name: string) => {
   await pool.query('INSERT INTO schema_migrations (name) VALUES (?)', [name]);
};

export const runMigrations = async () => {
   await createSchemaMigrationsTable();
   const appliedMigrationNames = await getAppliedMigrationNames();

   for (const migration of migrations) {
      if (appliedMigrationNames.has(migration.name)) {
         continue;
      }

      logger.info('Applying database migration', {
         migration: migration.name,
      });
      await migration.up(pool);
      await markMigrationAsApplied(migration.name);
      logger.info('Database migration applied', {
         migration: migration.name,
      });
   }
};

if (import.meta.main) {
   void runMigrations()
      .then(() => {
         logger.info('Database migrations completed');
         process.exit(0);
      })
      .catch((error) => {
         logger.error('Database migrations failed', {
            error: error instanceof Error ? error.message : String(error),
         });
         process.exit(1);
      });
}
