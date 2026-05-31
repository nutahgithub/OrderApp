import { httpRequest } from "../../lib/api/http";
import type {
  CreateMenuRequest,
  DeleteMenuResponse,
  ListMenuCategoriesResponse,
  ListMenusResponse,
  MenuCategoryFormRequest,
  MenuCategoryResponse,
  MenuFormRequest,
  MenuResponse,
  UploadImageRequest,
  UploadImageResponse
} from "../../lib/api/types";

export const menusApi = {
  list: (token: string) => httpRequest<ListMenusResponse>("/admin/menus", { token }),
  listCategories: (token: string) => httpRequest<ListMenuCategoriesResponse>("/admin/menus/categories", { token }),
  createCategory: (token: string, body: { name: string; sortOrder?: number }) =>
    httpRequest<MenuCategoryResponse>("/admin/menus/categories", { method: "POST", token, body: JSON.stringify(body) }),
  updateCategory: (token: string, categoryId: string, body: MenuCategoryFormRequest) =>
    httpRequest<MenuCategoryResponse>(`/admin/menus/categories/${categoryId}`, { method: "PATCH", token, body: JSON.stringify(body) }),
  deleteCategory: (token: string, categoryId: string) =>
    httpRequest<DeleteMenuResponse>(`/admin/menus/categories/${categoryId}`, { method: "DELETE", token }),
  create: (token: string, body: CreateMenuRequest) =>
    httpRequest<MenuResponse>("/admin/menus", { method: "POST", token, body: JSON.stringify(body) }),
  update: (token: string, menuId: string, body: MenuFormRequest) =>
    httpRequest<MenuResponse>(`/admin/menus/${menuId}`, { method: "PATCH", token, body: JSON.stringify(body) }),
  delete: (token: string, menuId: string) => httpRequest<DeleteMenuResponse>(`/admin/menus/${menuId}`, { method: "DELETE", token }),
  uploadImage: (token: string, body: UploadImageRequest) =>
    httpRequest<UploadImageResponse>("/admin/uploads/menu-images", {
      method: "POST",
      token,
      body: JSON.stringify(body)
    })
};
