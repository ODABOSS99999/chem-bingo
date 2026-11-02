import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const games=sqliteTable('games',{
 id:text('id').primaryKey(), day:text('day').notNull(), token:text('token').notNull(), name:text('name').notNull(),
 card:text('card').notNull(), marks:text('marks').notNull(), revision:integer('revision').notNull().default(0), updated:integer('updated').notNull()
});
