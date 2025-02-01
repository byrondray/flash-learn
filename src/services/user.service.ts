import { getDB } from "@/database/client";
import { users } from "@/database/schema/users";
import { eq } from "drizzle-orm";

const db = getDB();

export async function createUser(id: string, email: string) {
  return await db.insert(users).values({ id, email }).returning();
}

export async function getUser(id: string) {
  return await db.select({ users }).from(users).where(eq(users.id, id));
}

export async function getUserByEmail(email: string) {
  return await db.select({ users }).from(users).where(eq(users.email, email));
}
