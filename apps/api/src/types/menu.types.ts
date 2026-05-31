export type MenuDto = {
  id: string;
  tenantId: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySortOrder: number | null;
  name: string;
  price: string;
  imageUrl: string | null;
  isActive: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sortOrder: number;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MenuCategoryDto = {
  id: string;
  tenantId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateMenuInput = {
  name: string;
  price: string;
  imageUrl?: string | null;
  categoryId?: string | null;
  isActive?: boolean;
  isOutOfStock?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  sortOrder?: number;
};

export type UpdateMenuInput = {
  name: string;
  price: string;
  imageUrl?: string | null;
  categoryId?: string | null;
  isActive: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sortOrder: number;
};

export type CreateMenuCategoryInput = {
  name: string;
  sortOrder?: number;
};

export type UpdateMenuCategoryInput = {
  name: string;
  sortOrder: number;
};
