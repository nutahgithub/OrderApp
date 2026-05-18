import { httpRequest } from "../../lib/api/http";
import type {
  CreateMenuRequest,
  ListMenusResponse,
  MenuFormRequest,
  MenuResponse,
  UploadImageRequest,
  UploadImageResponse
} from "../../lib/api/types";

export const menusApi = {
  list: (token: string) => httpRequest<ListMenusResponse>("/admin/menus", { token }),
  create: (token: string, body: CreateMenuRequest) =>
    httpRequest<MenuResponse>("/admin/menus", { method: "POST", token, body: JSON.stringify(body) }),
  update: (token: string, menuId: string, body: MenuFormRequest) =>
    httpRequest<MenuResponse>(`/admin/menus/${menuId}`, { method: "PATCH", token, body: JSON.stringify(body) }),
  uploadImage: (token: string, body: UploadImageRequest) =>
    httpRequest<UploadImageResponse>("/admin/uploads/menu-images", {
      method: "POST",
      token,
      body: JSON.stringify(body)
    })
};
