import type { Pool } from 'mysql2/promise';

export type Migration = {
   name: string;
   up: (pool: Pool) => Promise<void>;
};
