export function hasPermission(user: any, module: string, action: string): boolean {
  if (!user || !user.permissions) return false;
  if (user.role === 'Super Admin') return true;

  const userPermissions = user.permissions as any[];
  const modulePerm = userPermissions.find((p: any) => p.module === module);
  return modulePerm ? modulePerm.actions.includes(action) : false;
}
