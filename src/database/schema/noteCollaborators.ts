import { sqliteTable, text, index, primaryKey } from "drizzle-orm/sqlite-core";
import { notes } from "./notes";
import { users } from "./users";
import { sql } from "drizzle-orm";

export const noteCollaborators = sqliteTable(
  "noteCollaborators",
  {
    noteId: text("noteId")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permission: text("permission", { enum: ["edit", "view"] })
      .notNull()
      .default("edit"),
    addedAt: text("addedAt").default(sql`(current_timestamp)`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.userId] }),
    noteIdx: index("idx_noteCollaborators_noteId").on(table.noteId),
    userIdx: index("idx_noteCollaborators_userId").on(table.userId),
  })
);

export type NoteCollaborator = typeof noteCollaborators.$inferSelect;
export type NoteCollaboratorInsert = typeof noteCollaborators.$inferInsert;
