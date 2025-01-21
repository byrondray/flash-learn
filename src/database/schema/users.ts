// docs: https://orm.drizzle.team/docs/sql-schema-declaration
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().notNull(),
  email: text('email').notNull(),
});

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
