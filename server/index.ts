import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { TiptapTransformer } from "@hocuspocus/transformer";
import { generateHTML } from "@tiptap/core";
import { createClient } from "@libsql/client";
import * as Y from "yjs";
import "dotenv/config";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
(globalThis as Record<string, unknown>).window = dom.window;
(globalThis as Record<string, unknown>).document = dom.window.document;

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

        try {
          const result = await db.execute({
            sql: "SELECT yjsState, content FROM notes WHERE id = ?",
            args: [documentName],
          });

          const row = result.rows[0];
          if (!row) {
            return null;
          }

          if (row.yjsState) {
            const raw = row.yjsState;
            if (raw instanceof Uint8Array) {
              return raw;
            }
            if (raw instanceof ArrayBuffer) {
              return new Uint8Array(raw);
            }
            if (Buffer.isBuffer(raw)) {
              return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
            }
            return null;
          }

          const htmlContent = (row.content as string) || "";
          if (!htmlContent || htmlContent.length < 3) return null;

          const safeHtml = htmlContent.startsWith("<")
            ? htmlContent
            : `<p>${htmlContent}</p>`;

          try {
            const ydoc = TiptapTransformer.toYdoc(
              safeHtml,
              "default",
              tiptapExtensions
            );
            const state = Y.encodeStateAsUpdate(ydoc);
            ydoc.destroy();
            return state;
          } catch {
            return null;
          }
        } catch {
          return null;
        }
      },

      async store(data) {
        const { documentName, state } = data;

        try {
          const ydoc = new Y.Doc();
          Y.applyUpdate(ydoc, state);
          const json = TiptapTransformer.fromYdoc(ydoc, "default");
          ydoc.destroy();

          const html = generateHTML(json, tiptapExtensions);
          const lastUpdated = new Date().toISOString();

          await db.execute({
            sql: "UPDATE notes SET yjsState = ?, content = ?, lastUpdated = ? WHERE id = ?",
            args: [Buffer.from(state), html, lastUpdated, documentName],
          });
        } catch {}
      },
    }),
  ],
});

server.listen();
