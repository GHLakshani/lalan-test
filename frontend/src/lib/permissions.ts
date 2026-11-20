import type { PermissionValue, User } from "@/lib/types";

export const PERMISSIONS = {
  createRequests: "requests.create",
  changeStatus: "requests.change_status",
} as const satisfies Record<string, PermissionValue>;

export const PERMISSION_LABELS: Record<PermissionValue, string> = {
  "requests.create": "Create requests",
  "requests.change_status": "Change status",
};

export function can(user: User | null | undefined, permission: PermissionValue) {
  return Boolean(user && (user.is_admin || user.permissions.includes(permission)));
}
