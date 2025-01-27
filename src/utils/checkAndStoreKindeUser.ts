import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { getDB } from "@/database/client";
import { users } from "@/database/schema/users";
import { eq } from "drizzle-orm";

const db = getDB();

const { getUser } = getKindeServerSession();

export const checkAndStoreKindeUser = async () => {
  try {
    const user = await getUser();

    if (!user) {
      return;
    }

    let storedUser = await db.select().from(users).where(eq(users.id, user.id));

    if (!storedUser || storedUser.length === 0) {
      if (user.id && user.email) {
        const r = await db
          .insert(users)
          .values({ id: user.id, email: user.email })
          .returning();
        return r;
      }
    }
  } catch (error) {
    console.error("Error checking or storing Kinde user:", error);
  }
};
