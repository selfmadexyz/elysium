import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations');
}

const migrationsFolder = process.argv[2] ?? `${import.meta.dir}/drizzle`;
const pool = new Pool({ connectionString: databaseUrl, max: 1 });

try {
  await migrate(drizzle(pool), { migrationsFolder });
  console.log(`Migrations from ${migrationsFolder} applied`);
} finally {
  await pool.end();
}
