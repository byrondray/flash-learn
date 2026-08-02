import { Server, MessageType, IncomingMessage } from "@hocuspocus/server";
import { messageYjsSyncStep1 } from "y-protocols/sync";
import { Database } from "@hocuspocus/extension-database";
import { TiptapTransformer } from "@hocuspocus/transformer";
import { generateHTML, generateJSON } from "@tiptap/core";
import { createClient } from "@libsql/client";
import * as Y from "yjs";
import "dotenv/config";
import { JSDOM } from "jsdom";
import { createRemoteJWKSet, jwtVerify } from "jose";

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
const kindeIssuerUrl = process.env.KINDE_ISSUER_URL;

if (!dbUrl) {
  throw new Error("Missing DB_URL env variable");
}

if (!kindeIssuerUrl) {
  throw new Error("Missing KINDE_ISSUER_URL env variable");
}

const db = createClient({
  url: dbUrl,
  authToken: authToken,
});

// Verifies the Kinde-issued access token sent by the client and returns the
// authenticated user's Kinde `sub` claim. Never trust a bare user ID sent
// over the wire (as the old `token: userId` scheme did) — it's a public
// identifier visible in URLs, awareness payloads, and collaborator lists,
// not a secret, so anyone who learns another user's ID could previously
// open a connection impersonating them.
const jwks = createRemoteJWKSet(
  new URL("/.well-known/jwks", kindeIssuerUrl)
);

async function verifyAccessToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: kindeIssuerUrl,
  });
  if (!payload.sub) {
    throw new Error("Token missing subject claim");
  }
  return payload.sub;
}

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
    const { token, documentName } = data;
    if (!token) {
      throw new Error("Authentication required");
    }

    // `token` must be a verified Kinde access token, not a bare user ID —
    // this is the only thing standing between a client and impersonating
    // any other user on this document.
    const userId = await verifyAccessToken(token);

    const ownerResult = await db.execute({
      sql: "SELECT id FROM notes WHERE id = ? AND userId = ?",
      args: [documentName, userId],
    });
    if (ownerResult.rows.length > 0) {
      return { userId, permission: "edit" as const };
    }

    const collaboratorResult = await db.execute({
      sql: "SELECT permission FROM noteCollaborators WHERE noteId = ? AND userId = ?",
      args: [documentName, userId],
    });
    if (collaboratorResult.rows.length > 0) {
      const permission = collaboratorResult.rows[0].permission as
        | "edit"
        | "view";
      return { userId, permission };
    }

    throw new Error("Access denied");
  },

  // `onAuthenticate`'s return value is merged into hook `context`, not into
  // the connection's `readOnly` flag (this Hocuspocus version never reads a
  // hook-provided `readOnly`), so view-only permission has to be enforced
  // here by rejecting sync/update messages before they're applied to the
  // Yjs doc. Awareness/auth/query messages are left alone so cursors and
  // presence still work for view-only collaborators.
  //
  // MessageType.Sync (Hocuspocus's outer envelope) carries three distinct
  // Yjs sync-protocol sub-messages, distinguished by a second varuint:
  // SyncStep1 (client requesting the doc's current state — read, must be
  // allowed or a view-only client can never load the document), SyncStep2,
  // and Update (both writes). Blocking on the outer type alone blocks
  // SyncStep1 too and breaks loading for view-only collaborators entirely.
  // messageYjsSyncStep1 comes from `y-protocols/sync`, the public/versioned
  // Yjs wire protocol Hocuspocus itself is built on — not an
  // @hocuspocus/server internal — so this is stable API to depend on.
  async beforeHandleMessage(data) {
    const { context, update } = data;
    if (context.permission === "view") {
      const message = new IncomingMessage(update);
      message.readVarString(); // documentName, unused here
      const type = message.readVarUint();
      if (type === MessageType.Sync) {
        const subType = message.readVarUint();
        if (subType !== messageYjsSyncStep1) {
          throw new Error("Read-only: editing is not permitted");
        }
      }
    }
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
          // Guard against genuinely empty/whitespace-only content, not an
          // arbitrary length floor — the old `.length < 3` check silently
          // discarded real short notes (e.g. "hi"), presenting them to the
          // collaboration client as an empty document.
          if (!htmlContent.trim()) return null;

          const safeHtml = htmlContent.startsWith("<")
            ? htmlContent
            : `<p>${htmlContent}</p>`;

          try {
            const json = generateJSON(safeHtml, tiptapExtensions);
            const ydoc = TiptapTransformer.toYdoc(
              json,
              "default",
              tiptapExtensions
            );
            const state = Y.encodeStateAsUpdate(ydoc);
            ydoc.destroy();
            return state;
          } catch (err) {
            // A corrupt/unparsable HTML snapshot silently presenting as an
            // empty doc is dangerous: the next store() would then persist
            // that empty doc over the real content. Log loudly so this is
            // caught instead of quietly losing notes.
            console.error(
              `[Database.fetch] Failed to convert HTML to Yjs state for document ${documentName}:`,
              err
            );
            return null;
          }
        } catch (err) {
          console.error(
            `[Database.fetch] Failed to load document ${documentName}:`,
            err
          );
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
        } catch (err) {
          // Persistence failing silently means collaborative edits are
          // lost with zero signal — log so this is at least observable.
          console.error(
            `[Database.store] Failed to persist document ${documentName}:`,
            err
          );
        }
      },
    }),
  ],
});

server.listen();
