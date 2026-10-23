export type Role = "admin" | "editor" | "viewer";

const ROLE_WEIGHT: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
};

export function hasMinimumRole(currentRole: Role, minimumRole: Role): boolean {
  return (ROLE_WEIGHT[currentRole] ?? 0) >= (ROLE_WEIGHT[minimumRole] ?? 0);
}
