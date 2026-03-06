import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { TiptapTransformer } from "@hocuspocus/transformer";
import { createClient } from "@libsql/client";
import * as Y from "yjs";
import "dotenv/config";

import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeaderCell from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import CharacterCount from "@tiptap/extension-character-count";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";

const dbUrl = process.env.DB_URL;
const authToken = process.env.AUTH_TOKEN;

if (!dbUrl) {
  throw new Error("Missing DB_URL env variable");
}

const db = createClient({
  url: dbUrl,
  authToken: authToken,
});

const tiptapExtensions = [
  StarterKit.configure({
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
  }),
  TextStyle,
  Color,
  Underline,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Highlight.configure({ multicolor: true }),
  BulletList,
  OrderedList,
  TaskList,
  TaskItem.configure({ nested: true }),
  Link.configure({ openOnClick: false }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeaderCell,
  TableCell,
  CharacterCount,
];

const server = Server.configure({
  port: parseInt(process.env.PORT || "8080", 10),

  async onAuthenticate(data) {
    const { token } = data;
    if (!token) {
      throw new Error("Authentication required");
    }
    return { userId: token };
  },

  extensions: [
    new Database({
      async fetch(data) {
        const { documentName } = data;

        const result = await db.execute({
          sql: "SELECT yjsState, content FROM notes WHERE id = ?",
          args: [documentName],
        });

        const row = result.rows[0];
        if (!row) return null;

        if (row.yjsState) {
          const buffer = row.yjsState as ArrayBuffer;
          return new Uint8Array(buffer);
        }

        // Legacy note — convert HTML content to Yjs state
        const htmlContent = (row.content as string) || "";
        if (!htmlContent) return null;

        const ydoc = TiptapTransformer.toYdoc(
          htmlContent,
          "default",
          tiptapExtensions
        );
        const state = Y.encodeStateAsUpdate(ydoc);
        ydoc.destroy();

        return state;
      },

      async store(data) {
        const { documentName, state } = data;

        // Convert Yjs state back to HTML for search/preview/AI features
        const ydoc = new Y.Doc();
        Y.applyUpdate(ydoc, state);
        const html = TiptapTransformer.fromYdoc(ydoc, "default");
        ydoc.destroy();

        const lastUpdated = new Date().toISOString();

        await db.execute({
          sql: "UPDATE notes SET yjsState = ?, content = ?, lastUpdated = ? WHERE id = ?",
          args: [Buffer.from(state), html, lastUpdated, documentName],
        });
      },
    }),
  ],
});

server.listen();

console.log(
  `Hocuspocus collaboration server running on port ${process.env.PORT || 8080}`
);
