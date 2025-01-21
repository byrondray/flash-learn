import type { Config } from 'drizzle-kit';
import { config } from './src/database/client';

export default {
  dialect: 'turso',
  schema: './src/database/schema/*',
  out: './drizzle',
  dbCredentials: config,
} satisfies Config;
