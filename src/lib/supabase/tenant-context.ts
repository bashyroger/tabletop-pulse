import { cookies } from "next/headers";
import { cache } from "react";
import { createClient } from "./server";
import type { Role } from "@/lib/auth/roles";

export const DEFAULT_GROUP_ID = "9608effa-cb3a-4b11-a099-3d1142e293a3";
export const ACTIVE_GROUP_COOKIE = "tabletop_pulse_group_id";

export interface GroupSummary {
  group_id: string;
  slug: string;
  name: string;
  city: string;
  role: Role;
}

export interface TenantWorkspaceContext {
  userId: string | null;
  activeGroupId: string;
  activeGroupSlug: string;
  activeGroupName: string;
  activeGroupTagline: string;
  activeGroupCity: string;
  role: Role;
  groups: GroupSummary[];
}

export const getTenantWorkspace = cache(
  async (): Promise<TenantWorkspaceContext> => {
    const cookieStore = await cookies();
    const cookieGroupId = cookieStore.get(ACTIVE_GROUP_COOKIE)?.value;

    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("bg_get_workspace_v2");

      if (!error && data && typeof data === "object" && !Array.isArray(data)) {
        const raw = data as Record<string, unknown>;
        const groups = Array.isArray(raw.groups)
          ? (raw.groups as unknown as GroupSummary[])
          : [];

        const matchedCookieGroup = cookieGroupId
          ? groups.find((g) => g.group_id === cookieGroupId)
          : undefined;

        const activeGroupId =
          matchedCookieGroup?.group_id ??
          (typeof raw.active_group_id === "string"
            ? raw.active_group_id
            : DEFAULT_GROUP_ID);

        const activeGroupName =
          matchedCookieGroup?.name ??
          (typeof raw.active_group_name === "string"
            ? raw.active_group_name
            : "Amsterdam Meeple Society");

        const activeGroupSlug =
          matchedCookieGroup?.slug ??
          (typeof raw.active_group_slug === "string"
            ? raw.active_group_slug
            : "amsterdam-meeple-society");

        const activeGroupCity =
          matchedCookieGroup?.city ??
          (typeof raw.active_group_city === "string"
            ? raw.active_group_city
            : "Amsterdam");

        return {
          userId: typeof raw.user_id === "string" ? raw.user_id : null,
          activeGroupId,
          activeGroupSlug,
          activeGroupName,
          activeGroupTagline:
            typeof raw.active_group_tagline === "string"
              ? raw.active_group_tagline
              : "Weekly heavy Euro, engine-building & asymmetric strategy nights along the canals.",
          activeGroupCity,
          role:
            raw.role === "admin" ||
            raw.role === "editor" ||
            raw.role === "viewer"
              ? raw.role
              : "editor",
          groups:
            groups.length > 0
              ? groups
              : [
                  {
                    group_id: DEFAULT_GROUP_ID,
                    slug: "amsterdam-meeple-society",
                    name: "Amsterdam Meeple Society",
                    city: "Amsterdam",
                    role: "editor",
                  },
                ],
        };
      }
    } catch {
      // Fallback to default showcase club
    }

    return {
      userId: null,
      activeGroupId: DEFAULT_GROUP_ID,
      activeGroupSlug: "amsterdam-meeple-society",
      activeGroupName: "Amsterdam Meeple Society",
      activeGroupTagline:
        "Weekly heavy Euro, engine-building & asymmetric strategy nights along the canals.",
      activeGroupCity: "Amsterdam",
      role: "editor",
      groups: [
        {
          group_id: DEFAULT_GROUP_ID,
          slug: "amsterdam-meeple-society",
          name: "Amsterdam Meeple Society",
          city: "Amsterdam",
          role: "editor",
        },
      ],
    };
  }
);
