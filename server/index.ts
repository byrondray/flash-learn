import { Server } from "@hocuspocus/server";
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

// Re-derives a user's current permission for a note directly from the DB —
// used both at connect time and to periodically refresh an already-open
// connection, since a collaborator's permission can be downgraded (or
// revoked) by the owner while their WebSocket session is still open.
async function lookupPermission(
  documentName: string,
  userId: string
): Promise<"edit" | "view" | null> {
  const ownerResult = await db.execute({
    sql: "SELECT id FROM notes WHERE id = ? AND userId = ?",
    args: [documentName, userId],
  });
  if (ownerResult.rows.length > 0) {
    return "edit";
  }

  const collaboratorResult = await db.execute({
    sql: "SELECT permission FROM noteCollaborators WHERE noteId = ? AND userId = ?",
    args: [documentName, userId],
  });
  if (collaboratorResult.rows.length > 0) {
    return collaboratorResult.rows[0].permission as "edit" | "view";
  }

  return null;
}

// Throttles the per-message permission re-check in `beforeHandleMessage` —
// keyed by connection object identity (a WeakMap so entries for closed
// connections are garbage-collected automatically, no manual cleanup
// needed) so each open socket is checked on its own schedule.
const PERMISSION_RECHECK_MS = 10_000;
const permissionCheckedAt = new WeakMap<object, number>();

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
    const { token, documentName, connection } = data;
    if (!token) {
      throw new Error("Authentication required");
    }

    // `token` must be a verified Kinde access token, not a bare user ID —
    // this is the only thing standing between a client and impersonating
    // any other user on this document.
    const userId = await verifyAccessToken(token);

    const permission = await lookupPermission(documentName, userId);
    if (!permission) {
      throw new Error("Access denied");
    }

    // Setting `connection.readOnly` uses Hocuspocus's own native read-only
    // gate (it rejects sync/update messages with a graceful ack instead of
    // throwing, and never blocks SyncStep1, so the doc still loads) rather
    // than hand-parsing the Yjs wire protocol to reimplement the same
    // behavior less reliably.
    connection.readOnly = permission === "view";

    return { userId, permission };
  },

  // `readOnly` above is only set once, at initial connect, and Hocuspocus
  // has no hook that fires per-message before this one to refresh it. A
  // collaborator's permission can be downgraded by the owner while their
  // socket stays open, so re-derive it from the DB here and flip
  // `connection.readOnly` live — throttled per-connection so this isn't a
  // DB round trip on every keystroke.
  async beforeHandleMessage(data) {
    const { context, connection, documentName } = data;
    const now = Date.now();
    const lastChecked = permissionCheckedAt.get(connection) ?? 0;
    if (now - lastChecked < PERMISSION_RECHECK_MS) return;
    permissionCheckedAt.set(connection, now);

    const permission = await lookupPermission(documentName, context.userId);
    connection.readOnly = permission !== "edit";
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

        // No permission re-check here: `onStoreDocumentPayload` only carries
        // `context`, which is fixed at initial auth and doesn't reflect a
        // permission downgrade applied mid-session — `connection.readOnly`
        // (kept live by `beforeHandleMessage`'s periodic re-check) is the
        // actual source of truth, and it's what stops a view-only
        // connection's writes from ever reaching the Yjs doc in the first
        // place, so nothing unauthorized should reach `store()` to begin
        // with.
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
