"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACTIVE_GROUP_COOKIE } from "@/lib/supabase/tenant-context";

export async function switchActiveGroupAction(groupId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_GROUP_COOKIE, groupId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { success: true };
}
