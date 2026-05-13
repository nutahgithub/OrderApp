export type BranchDto = {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBranchInput = {
  name: string;
};

export type UpdateBranchInput = {
  name: string;
};
