export const ROLE_PERMISSIONS = {
  system: ["create:core", "create:staff", "create:categories", "set:sms"],

  director: [
    "create:core",
    "edit:core",
    "create:staff",
    "view:staff",
    "edit:staff",
    "delete:staff",
    // "create:order",
    "view:orders",
    "view:stock",
    "edit:orders",
    "create:product",
    "edit:product",
    "view:analytics",
    "set:sms",
  ],

  manager: [
    "create:staff:branch-only", // ← Clear: branch restriction
    "view:staff:branch-only",
    "edit:staff:branch-only",
    "create:product",
    "edit:product:branch-only",
    "delete:product:branch-only",
    "view:orders",
    "view:stock:branch-only",
    "view:analytics",
    "create:categories",
    "set:sms",
  ],

  cashier: [
    "create:customer",
    "create:order", // ← Clear: own records only
    "view:orders", //"view:orders:own-only",
    "edit:orders:own-only",
    "create:temporary-product",
    "move:temporary-product",
    "create:customer",
  ],

  uniter: [
    //recomond for single branch which want one account access
    "create:customer",
    "create:core",
    "edit:core",
    "create:staff:branch-only", // ← Clear: branch restriction
    "view:staff:branch-only",
    "edit:staff:branch-only",
    "create:product",
    "create:temporary-product",
    "move:temporary-product",
    "edit:product",
    "delete:product",
    "create:order",
    "view:orders",
    "edit:orders:branch-only",
    "create:stock",
    "view:stock",
    "edit:stock:branch-only",
    "view:analytics",
    "create:categories",
    "set:sms",
    "create:customer",
  ],
  stockman: [
    "create:stock",
    "view:stock:branch-only",
    "edit:stock:branch-only",
  ],
} as const;

export type T_Role = keyof typeof ROLE_PERMISSIONS;
type ExtractPermissions<T> = T[keyof T] extends ReadonlyArray<infer U>
  ? U
  : never;
export type T_Permission = ExtractPermissions<typeof ROLE_PERMISSIONS>;

export function hasPermission({
  userRole,
  permission,
  resourceBranch,
  userBranch,
}: {
  userRole: T_Role | undefined;
  permission: T_Permission;
  resourceBranch?: string;
  userBranch?: string;
}) {
  if (!userRole) return false;

  const allowed = ROLE_PERMISSIONS[userRole] as readonly string[];

  // Check if permission exists
  const hasBasicPermission = allowed.some(
    (p) =>
      p === permission ||
      p.startsWith(permission.split(":").slice(0, 2).join(":"))
  );

  if (!hasBasicPermission) return false;

  // Check branch restriction
  const branchOnlyPermission = allowed.find((p) => p.includes("branch-only"));
  if (
    branchOnlyPermission &&
    branchOnlyPermission.startsWith(permission.split(":").slice(0, 2).join(":"))
  ) {
    return resourceBranch === userBranch;
  }

  return true;
}
