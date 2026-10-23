import { getTenantWorkspace } from "@/lib/supabase/tenant-context";
import { hasMinimumRole, type Role } from "./roles";

export async function requireGroupAccess(minimumRole: Role = "editor") {
  const workspace = await getTenantWorkspace();
  if (!hasMinimumRole(workspace.role, minimumRole)) {
    throw new Error(`Insufficient permissions: requires ${minimumRole} role`);
  }
  return workspace;
}
