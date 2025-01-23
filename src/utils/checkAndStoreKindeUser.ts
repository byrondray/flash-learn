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

    if (!storedUser) {
      if (user.id && user.email) {
        await db.insert(users).values({ id: user.id, email: user.email });
      }
    }
  } catch (error) {
    console.error("Error checking or storing Kinde user:", error);
  }
};
