---
applyTo: "src/**"
---

# Next.js Conventions

## Server Actions

- Co-locate in `actions.ts` next to the page that uses them
- Always start with `"use server"` directive
- Always authenticate first: `getKindeServerSession()` → `getUser()` → throw if no `user.id`
- Delegate business logic to service files in `src/services/`

## Revalidation

- **Always call `revalidatePath()` after any mutation** (create, update, delete)
- Revalidate the routes that display the affected data
- Import from `next/cache`

```typescript
import { revalidatePath } from "next/cache";

export async function deleteItem(id: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  await deleteItemService(id, user.id);
  revalidatePath(`/items/viewAll/${user.id}`);
}
```

## Client vs Server

- Pages are `"use client"` — data fetching via `useEffect` calling server actions
- Server actions are `"use server"` in separate `actions.ts` files
- Components in `src/components/` are `"use client"`

## Navigation

- Use `useRouter()` from `next/navigation`
- `router.push()` for standard navigation
- `router.replace()` when the current URL should not stay in history (e.g., after accepting an invite)

## Route Protection

- Middleware (`src/middleware.ts`) protects routes via Kinde auth
- Server actions independently verify the user — never trust only middleware
