export const tenantRoom = (tenantId: string): string => `tenant:${tenantId}`;

export const branchRoom = (tenantId: string, branchId: string): string => {
  return `${tenantRoom(tenantId)}:branch:${branchId}`;
};

export const tableRoom = (tenantId: string, branchId: string, tableId: string): string => {
  return `${branchRoom(tenantId, branchId)}:table:${tableId}`;
};

