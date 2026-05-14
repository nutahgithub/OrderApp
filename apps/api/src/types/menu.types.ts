export type MenuDto = {
  id: string;
  tenantId: string;
  name: string;
  price: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateMenuInput = {
  name: string;
  price: string;
  imageUrl?: string | null;
  isActive?: boolean;
};

export type UpdateMenuInput = {
  name: string;
  price: string;
  imageUrl?: string | null;
  isActive: boolean;
};
