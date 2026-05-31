import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { EyeOff, PackageCheck, PackageX, Pencil, Plus, Search, Tags, Trash2, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { SelectField } from "../../components/ui/SelectField";
import { StateMessage } from "../../components/ui/StateMessage";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAuth } from "../../features/auth/AuthContext";
import {
  useCreateMenuCategoryMutation,
  useCreateMenuMutation,
  useDeleteMenuCategoryMutation,
  useMenuCategoriesQuery,
  useDeleteMenuMutation,
  useUpdateMenuCategoryMutation,
  useMenusQuery,
  useUpdateMenuMutation,
  useUploadMenuImageMutation
} from "../../features/menus/hooks";
import { menuCategorySchema, menuSchema } from "../../features/menus/schemas";
import type { Menu, MenuCategory } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

type EditingMenu = {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  imageFile: File | null;
  categoryId: string | null;
  isActive: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sortOrder: number;
};

type EditingCategory = Pick<MenuCategory, "id" | "name" | "sortOrder">;

const maxCompressedImageBytes = 1_000_000;
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const menusPerPage = 12;

const formatCurrency = (price: string): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 2
  }).format(Number(price));
};

const normalizeMenuSearchText = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
};

const normalizePriceInput = (value: string): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  const [wholePart = "", decimalPart] = trimmedValue.split(",");
  const wholeDigits = wholePart.replace(/\D/g, "").replace(/^0+(?=\d)/, "");

  if (decimalPart === undefined) {
    return wholeDigits;
  }

  const decimalDigits = decimalPart.replace(/\D/g, "").slice(0, 2);

  return decimalDigits ? `${wholeDigits || "0"}.${decimalDigits}` : wholeDigits;
};

const formatPriceInput = (price: string): string => {
  if (!price) {
    return "";
  }

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2
  }).format(Number(price));
};

const readFileAsDataUrl = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
};

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Invalid image"));
    };
    image.src = objectUrl;
  });
};

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to compress image"));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
};

const compressImageForUpload = async (
  file: File,
  translate: (key: MessageKey) => string
): Promise<{ fileName: string; contentType: "image/jpeg"; dataBase64: string }> => {
  if (!acceptedImageTypes.some((contentType) => contentType === file.type)) {
    throw new Error(translate(MessageKey.MenusImageInvalid));
  }

  const image = await loadImage(file);
  let width = image.naturalWidth;
  let height = image.naturalHeight;
  const maxSide = 1600;

  if (Math.max(width, height) > maxSide) {
    const ratio = maxSide / Math.max(width, height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(translate(MessageKey.MenusImageInvalid));
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.86, 0.76, 0.66, 0.56]) {
      const blob = await canvasToBlob(canvas, quality);

      if (blob.size <= maxCompressedImageBytes) {
        const dataUrl = await readFileAsDataUrl(blob);
        const [, dataBase64 = ""] = dataUrl.split(",");

        return {
          fileName: file.name.replace(/\.[^.]+$/, ".jpg"),
          contentType: "image/jpeg",
          dataBase64
        };
      }
    }

    width = Math.max(320, Math.round(width * 0.78));
    height = Math.max(320, Math.round(height * 0.78));
  }

  throw new Error(translate(MessageKey.MenusImageTooLarge));
};

export const AdminMenusPage = () => {
  const { token, logout } = useAuth();
  const { locale, t } = useI18n();
  const menusQuery = useMenusQuery(token);
  const categoriesQuery = useMenuCategoriesQuery(token);
  const createCategoryMutation = useCreateMenuCategoryMutation(token);
  const updateCategoryMutation = useUpdateMenuCategoryMutation(token);
  const deleteCategoryMutation = useDeleteMenuCategoryMutation(token);
  const createMenuMutation = useCreateMenuMutation(token);
  const updateMenuMutation = useUpdateMenuMutation(token);
  const deleteMenuMutation = useDeleteMenuMutation(token);
  const uploadMenuImageMutation = useUploadMenuImageMutation(token);
  const menuImageInputRef = useRef<HTMLInputElement | null>(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuImageFile, setNewMenuImageFile] = useState<File | null>(null);
  const [newMenuCategoryId, setNewMenuCategoryId] = useState<string | null>(null);
  const [newMenuIsActive, setNewMenuIsActive] = useState(true);
  const [newMenuIsOutOfStock, setNewMenuIsOutOfStock] = useState(false);
  const [newMenuIsFeatured, setNewMenuIsFeatured] = useState(false);
  const [newMenuIsNew, setNewMenuIsNew] = useState(false);
  const [newMenuSortOrder, setNewMenuSortOrder] = useState(0);
  const [editingMenu, setEditingMenu] = useState<EditingMenu | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySortOrder, setNewCategorySortOrder] = useState(0);
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [showHiddenMenus, setShowHiddenMenus] = useState(true);
  const [menuPage, setMenuPage] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorTitle, setFormErrorTitle] = useState<MessageKey>(MessageKey.MenusUnableToSave);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busyMenuId, setBusyMenuId] = useState<string | null>(null);

  const menus = menusQuery.data?.menus ?? [];
  const categories = categoriesQuery.data?.categories ?? menusQuery.data?.categories ?? [];
  const visibleMenuCount = menus.filter((menu) => menu.isActive).length;
  const hiddenMenuCount = menus.length - visibleMenuCount;
  const isSubmitting = createMenuMutation.isPending || updateMenuMutation.isPending || uploadMenuImageMutation.isPending;
  const isCategorySubmitting = createCategoryMutation.isPending || updateCategoryMutation.isPending || deleteCategoryMutation.isPending;
  const normalizedMenuSearch = normalizeMenuSearchText(menuSearch.trim());
  const filteredMenus = useMemo(() => {
    return menus
      .filter((menu) => {
        const matchesStatus = showHiddenMenus || menu.isActive;
        const matchesSearch =
          normalizedMenuSearch === "" ||
          normalizeMenuSearchText(menu.name).includes(normalizedMenuSearch) ||
          normalizeMenuSearchText(menu.categoryName ?? "").includes(normalizedMenuSearch);

        return matchesStatus && matchesSearch;
      })
      .sort((left, right) => {
        return (
          (left.categorySortOrder ?? 9999) - (right.categorySortOrder ?? 9999) ||
          (left.categoryName ?? t(MessageKey.MenusUncategorized)).localeCompare(
            right.categoryName ?? t(MessageKey.MenusUncategorized)
          ) ||
          left.sortOrder - right.sortOrder ||
          left.name.localeCompare(right.name)
        );
      });
  }, [menus, normalizedMenuSearch, showHiddenMenus, t]);
  const totalMenuPages = Math.max(1, Math.ceil(filteredMenus.length / menusPerPage));
  const paginatedMenus = filteredMenus.slice((menuPage - 1) * menusPerPage, menuPage * menusPerPage);
  const groupedPaginatedMenus = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; sortOrder: number; menus: Menu[] }>();

    paginatedMenus.forEach((menu) => {
      const groupId = menu.categoryId ?? "uncategorized";
      const group = groups.get(groupId) ?? {
        id: groupId,
        name: menu.categoryName ?? t(MessageKey.MenusUncategorized),
        sortOrder: menu.categorySortOrder ?? 9999,
        menus: []
      };

      group.menus.push(menu);
      groups.set(groupId, group);
    });

    return [...groups.values()];
  }, [paginatedMenus, t]);

  useEffect(() => {
    if (!token) {
      logout();
    }
  }, [logout, token]);

  useEffect(() => {
    setMenuPage(1);
  }, [normalizedMenuSearch, showHiddenMenus]);

  useEffect(() => {
    setMenuPage((currentPage) => Math.min(currentPage, totalMenuPages));
  }, [totalMenuPages]);

  const resetForm = () => {
    setEditingMenu(null);
    setNewMenuName("");
    setNewMenuPrice("");
    setNewMenuImageFile(null);
    setNewMenuCategoryId(null);
    setNewMenuIsActive(true);
    setNewMenuIsOutOfStock(false);
    setNewMenuIsFeatured(false);
    setNewMenuIsNew(false);
    setNewMenuSortOrder(0);
    setFormError(null);
    setFormErrorTitle(MessageKey.MenusUnableToSave);
    if (menuImageInputRef.current) {
      menuImageInputRef.current.value = "";
    }
  };

  const uploadSelectedImage = async (_authToken: string, imageFile: File | null): Promise<string | null> => {
    if (!imageFile) {
      return null;
    }

    const uploadInput = await compressImageForUpload(imageFile, t);
    const response = await uploadMenuImageMutation.mutateAsync(uploadInput);

    return response.upload.url;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      logout();
      return;
    }

    const parsed = menuSchema.safeParse({
      name: newMenuName,
      price: newMenuPrice,
      imageFile: newMenuImageFile,
      imageUrl: null,
      categoryId: newMenuCategoryId,
      isActive: newMenuIsActive,
      isOutOfStock: newMenuIsOutOfStock,
      isFeatured: newMenuIsFeatured,
      isNew: newMenuIsNew,
      sortOrder: newMenuSortOrder
    });

    if (!parsed.success) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(t(parsed.error.issues[0]?.message as MessageKey));
      setSuccessMessage(null);
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    try {
      const uploadedImageUrl = await uploadSelectedImage(token, newMenuImageFile);
      await createMenuMutation.mutateAsync({
        name: parsed.data.name,
        price: parsed.data.price,
        imageUrl: uploadedImageUrl,
        categoryId: parsed.data.categoryId,
        isActive: parsed.data.isActive,
        isOutOfStock: parsed.data.isOutOfStock,
        isFeatured: parsed.data.isFeatured,
        isNew: parsed.data.isNew,
        sortOrder: parsed.data.sortOrder
      });
      resetForm();
      setSuccessMessage(t(MessageKey.MenusCreated));
    } catch (error: unknown) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !editingMenu) {
      logout();
      return;
    }

    const parsed = menuSchema.safeParse(editingMenu);

    if (!parsed.success) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(t(parsed.error.issues[0]?.message as MessageKey));
      setSuccessMessage(null);
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    try {
      const uploadedImageUrl = editingMenu.imageFile ? await uploadSelectedImage(token, editingMenu.imageFile) : null;
      await updateMenuMutation.mutateAsync({
        menuId: editingMenu.id,
        body: {
        name: parsed.data.name,
        price: parsed.data.price,
        imageUrl: uploadedImageUrl ?? (editingMenu.imageUrl || null),
        categoryId: parsed.data.categoryId,
        isActive: parsed.data.isActive,
        isOutOfStock: parsed.data.isOutOfStock,
        isFeatured: parsed.data.isFeatured,
        isNew: parsed.data.isNew,
        sortOrder: parsed.data.sortOrder
        }
      });
      resetForm();
      setSuccessMessage(t(MessageKey.MenusUpdated));
    } catch (error: unknown) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  const handleToggleActive = async (menu: Menu) => {
    if (!token) {
      logout();
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setBusyMenuId(menu.id);

    try {
      await updateMenuMutation.mutateAsync({
        menuId: menu.id,
        body: {
        name: menu.name,
        price: menu.price,
        imageUrl: menu.imageUrl,
        categoryId: menu.categoryId,
        isActive: !menu.isActive,
        isOutOfStock: menu.isOutOfStock,
        isFeatured: menu.isFeatured,
        isNew: menu.isNew,
        sortOrder: menu.sortOrder
        }
      });
      setSuccessMessage(menu.isActive ? t(MessageKey.MenusHiddenFromQr) : t(MessageKey.MenusAvailableToQr));
    } catch (error: unknown) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setBusyMenuId(null);
    }
  };

  const handleToggleStock = async (menu: Menu) => {
    if (!token) {
      logout();
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setBusyMenuId(menu.id);

    try {
      await updateMenuMutation.mutateAsync({
        menuId: menu.id,
        body: {
          name: menu.name,
          price: menu.price,
          imageUrl: menu.imageUrl,
          categoryId: menu.categoryId,
          isActive: menu.isActive,
          isOutOfStock: !menu.isOutOfStock,
          isFeatured: menu.isFeatured,
          isNew: menu.isNew,
          sortOrder: menu.sortOrder
        }
      });
      setSuccessMessage(t(MessageKey.MenusUpdated));
    } catch (error: unknown) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setBusyMenuId(null);
    }
  };

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = menuCategorySchema.safeParse({
      name: newCategoryName,
      sortOrder: newCategorySortOrder
    });

    if (!parsed.success) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(t(parsed.error.issues[0]?.message as MessageKey));
      return;
    }

    try {
      await createCategoryMutation.mutateAsync(parsed.data);
      setNewCategoryName("");
      setNewCategorySortOrder(0);
      setSuccessMessage(t(MessageKey.MenusCategorySaved));
    } catch (error: unknown) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) {
      return;
    }

    const parsed = menuCategorySchema.safeParse(editingCategory);

    if (!parsed.success) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(t(parsed.error.issues[0]?.message as MessageKey));
      return;
    }

    try {
      await updateCategoryMutation.mutateAsync({
        categoryId: editingCategory.id,
        body: parsed.data
      });
      setEditingCategory(null);
      setSuccessMessage(t(MessageKey.MenusCategorySaved));
    } catch (error: unknown) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  const handleDeleteCategory = async (category: MenuCategory) => {
    if (!window.confirm(t(MessageKey.MenusCategoryDeleteConfirm, { categoryName: category.name }))) {
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync(category.id);
      setSuccessMessage(t(MessageKey.MenusCategoryDeleted));
    } catch (error: unknown) {
      setFormErrorTitle(MessageKey.MenusUnableToSave);
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  const handleDelete = async (menu: Menu) => {
    if (!token) {
      logout();
      return;
    }

    const confirmed = window.confirm(t(MessageKey.MenusDeleteConfirm, { menuName: menu.name }));

    if (!confirmed) {
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setBusyMenuId(menu.id);

    try {
      await deleteMenuMutation.mutateAsync(menu.id);
      if (editingMenu?.id === menu.id) {
        resetForm();
      }
      setSuccessMessage(t(MessageKey.MenusDeleted));
    } catch (error: unknown) {
      setFormErrorTitle(MessageKey.MenusUnableToDelete);
      setFormError(getUserErrorMessage(error, MessageKey.MenusUnableToDelete, locale));
    } finally {
      setBusyMenuId(null);
    }
  };

  const formName = editingMenu ? editingMenu.name : newMenuName;
  const formPrice = editingMenu ? editingMenu.price : newMenuPrice;
  const formImageFile = editingMenu ? editingMenu.imageFile : newMenuImageFile;
  const formCategoryId = editingMenu ? editingMenu.categoryId : newMenuCategoryId;
  const formIsActive = editingMenu ? editingMenu.isActive : newMenuIsActive;
  const formIsOutOfStock = editingMenu ? editingMenu.isOutOfStock : newMenuIsOutOfStock;
  const formIsFeatured = editingMenu ? editingMenu.isFeatured : newMenuIsFeatured;
  const formIsNew = editingMenu ? editingMenu.isNew : newMenuIsNew;
  const formSortOrder = editingMenu ? editingMenu.sortOrder : newMenuSortOrder;
  const categoryOptions = [
    { label: t(MessageKey.MenusUncategorized), value: "none" },
    ...categories.map((category) => ({ label: category.name, value: category.id }))
  ];

  return (
    <section className="grid gap-5">
      <PageHeader eyebrow={t(MessageKey.Setup)} title={t(MessageKey.MenusTitle)} subtitle={t(MessageKey.MenusSubtitle)} />

      <section className="grid grid-cols-[minmax(340px,420px)_minmax(0,1fr)] items-start gap-4 max-[1100px]:grid-cols-1">
      <div className="grid min-w-0 gap-4 min-[1101px]:sticky min-[1101px]:top-7">
      <Panel className="grid gap-3">
        <h2 className="m-0 text-base">{editingMenu ? t(MessageKey.MenusEditTitle) : t(MessageKey.MenusCreateTitle)}</h2>
        <p className="-mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.MenusHint)}</p>
        <form className="grid gap-3" onSubmit={editingMenu ? handleUpdate : handleCreate}>
          <Input
            label={t(MessageKey.MenusDishNameLabel)}
            name="menuName"
            placeholder={t(MessageKey.MenusDishNamePlaceholder)}
            value={formName}
            onChange={(event) => {
              if (editingMenu) {
                setEditingMenu({ ...editingMenu, name: event.target.value });
              } else {
                setNewMenuName(event.target.value);
              }
            }}
            required
          />
          <label className="grid gap-1.5 text-sm font-semibold text-foreground" htmlFor="menuPrice">
            <span>{t(MessageKey.MenusPriceLabel)}</span>
            <span className="flex items-center gap-2">
              <input
                id="menuPrice"
                className="min-h-[42px] min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 text-foreground shadow-sm transition placeholder:text-muted-foreground/70 hover:border-ring/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                name="menuPrice"
                inputMode="decimal"
                placeholder={t(MessageKey.MenusPricePlaceholder)}
                value={formatPriceInput(formPrice)}
                onChange={(event) => {
                  const nextPrice = normalizePriceInput(event.target.value);

                  if (editingMenu) {
                    setEditingMenu({ ...editingMenu, price: nextPrice });
                  } else {
                    setNewMenuPrice(nextPrice);
                  }
                }}
                required
              />
              <span className="flex-none text-sm font-extrabold text-muted-foreground">VND</span>
            </span>
          </label>
          <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-foreground">
            <span>{t(MessageKey.MenusImageLabel)}</span>
            <input
              className="min-h-[42px] w-full rounded-md border border-input bg-card p-2 text-foreground"
              name="menuImage"
              ref={menuImageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;

                if (editingMenu) {
                  setEditingMenu({ ...editingMenu, imageFile: nextFile });
                } else {
                  setNewMenuImageFile(nextFile);
                }
              }}
            />
            <span className="text-xs font-medium leading-normal text-muted-foreground">
              {formImageFile
                ? t(MessageKey.MenusImageSelected, { fileName: formImageFile.name })
                : t(MessageKey.MenusImageHint)}
            </span>
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2 max-[520px]:grid-cols-1">
            <SelectField
              label={t(MessageKey.MenusCategoryLabel)}
              options={categoryOptions}
              value={formCategoryId ?? "none"}
              onValueChange={(value) => {
                const nextCategoryId = value === "none" ? null : value;

                if (editingMenu) {
                  setEditingMenu({ ...editingMenu, categoryId: nextCategoryId });
                } else {
                  setNewMenuCategoryId(nextCategoryId);
                }
              }}
            />
            <Input
              label={t(MessageKey.MenusSortOrderLabel)}
              name="menuSortOrder"
              type="number"
              min={0}
              value={String(formSortOrder)}
              onChange={(event) => {
                const nextSortOrder = Number(event.target.value || 0);

                if (editingMenu) {
                  setEditingMenu({ ...editingMenu, sortOrder: nextSortOrder });
                } else {
                  setNewMenuSortOrder(nextSortOrder);
                }
              }}
            />
          </div>
          <label className="flex min-h-[42px] items-center gap-2 rounded-md border border-border bg-muted/25 px-3 text-sm font-bold text-foreground max-[1100px]:justify-start">
            <input
              className="h-[18px] w-[18px]"
              type="checkbox"
              checked={formIsActive}
              onChange={(event) => {
                if (editingMenu) {
                  setEditingMenu({ ...editingMenu, isActive: event.target.checked });
                } else {
                  setNewMenuIsActive(event.target.checked);
                }
              }}
            />
            {t(MessageKey.MenusAvailableToCustomers)}
          </label>
          <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-muted/35 p-2 max-[520px]:grid-cols-1">
            <label className="flex min-h-[32px] items-center gap-2 text-sm font-bold text-foreground">
              <input
                className="h-[18px] w-[18px]"
                type="checkbox"
                checked={formIsOutOfStock}
                onChange={(event) => {
                  if (editingMenu) {
                    setEditingMenu({ ...editingMenu, isOutOfStock: event.target.checked });
                  } else {
                    setNewMenuIsOutOfStock(event.target.checked);
                  }
                }}
              />
              {t(MessageKey.MenusOutOfStockLabel)}
            </label>
            <label className="flex min-h-[32px] items-center gap-2 text-sm font-bold text-foreground">
              <input
                className="h-[18px] w-[18px]"
                type="checkbox"
                checked={formIsFeatured}
                onChange={(event) => {
                  if (editingMenu) {
                    setEditingMenu({ ...editingMenu, isFeatured: event.target.checked });
                  } else {
                    setNewMenuIsFeatured(event.target.checked);
                  }
                }}
              />
              {t(MessageKey.MenusFeaturedLabel)}
            </label>
            <label className="flex min-h-[32px] items-center gap-2 text-sm font-bold text-foreground">
              <input
                className="h-[18px] w-[18px]"
                type="checkbox"
                checked={formIsNew}
                onChange={(event) => {
                  if (editingMenu) {
                    setEditingMenu({ ...editingMenu, isNew: event.target.checked });
                  } else {
                    setNewMenuIsNew(event.target.checked);
                  }
                }}
              />
              {t(MessageKey.MenusNewLabel)}
            </label>
          </div>
          <div className="flex flex-wrap gap-2 max-[1100px]:justify-start">
            {editingMenu ? (
              <Button type="button" className="bg-muted text-secondary-foreground" disabled={isSubmitting} onClick={resetForm}>
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                {t(MessageKey.Cancel)}
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              {isSubmitting
                ? formImageFile
                  ? t(MessageKey.MenusUploadingImage)
                  : t(MessageKey.Saving)
                : editingMenu
                  ? t(MessageKey.SaveChanges)
                  : t(MessageKey.MenusCreateButton)}
            </Button>
          </div>
        </form>
        {successMessage ? <StateMessage title={successMessage} tone="success" /> : null}
        {formError ? (
          <StateMessage title={t(formErrorTitle)} description={formError} tone="error" />
        ) : null}
      </Panel>

      <Panel className="grid gap-3">
        <h2 className="m-0 inline-flex items-center gap-2 text-base">
          <Tags className="h-4 w-4 text-primary" aria-hidden="true" />
          {t(MessageKey.MenusCategoriesTitle)}
        </h2>
        <form className="grid grid-cols-[minmax(0,1fr)_86px] gap-2" onSubmit={handleCreateCategory}>
          <Input
            label={t(MessageKey.MenusCategoryNameLabel)}
            name="categoryName"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
          />
          <Input
            label={t(MessageKey.MenusSortOrderLabel)}
            name="categorySortOrder"
            type="number"
            min={0}
            value={String(newCategorySortOrder)}
            onChange={(event) => setNewCategorySortOrder(Number(event.target.value || 0))}
          />
          <Button type="submit" className="col-span-2 min-h-9 self-end max-[520px]:col-span-1" disabled={isCategorySubmitting}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {t(MessageKey.MenusCategoryCreateButton)}
          </Button>
        </form>
        {categories.length === 0 ? <StateMessage title={t(MessageKey.MenusNoCategories)} /> : null}
        {categories.length > 0 ? (
          <div className="grid gap-2">
            {categories.map((category) => {
              const isEditingCategory = editingCategory?.id === category.id;

              return (
                <div className="rounded-md border border-border bg-muted/30 p-2" key={category.id}>
                  {isEditingCategory ? (
                    <div className="grid grid-cols-[minmax(0,1fr)_78px] gap-2">
                      <Input
                        label={t(MessageKey.MenusCategoryNameLabel)}
                        value={editingCategory.name}
                        onChange={(event) =>
                          setEditingCategory({
                            ...editingCategory,
                            name: event.target.value
                          })
                        }
                      />
                      <Input
                        label={t(MessageKey.MenusSortOrderLabel)}
                        type="number"
                        min={0}
                        value={String(editingCategory.sortOrder)}
                        onChange={(event) =>
                          setEditingCategory({
                            ...editingCategory,
                            sortOrder: Number(event.target.value || 0)
                          })
                        }
                      />
                      <div className="col-span-2 flex flex-wrap gap-2">
                        <Button type="button" className="mt-0 min-h-9" disabled={isCategorySubmitting} onClick={() => void handleUpdateCategory()}>
                          {t(MessageKey.SaveChanges)}
                        </Button>
                        <Button type="button" className="mt-0 min-h-9 bg-muted text-secondary-foreground" disabled={isCategorySubmitting} onClick={() => setEditingCategory(null)}>
                          {t(MessageKey.Cancel)}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <div className="min-w-0">
                        <strong className="block truncate text-sm">{category.name}</strong>
                        <span className="text-xs font-bold text-muted-foreground">#{category.sortOrder}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          className="mt-0 min-h-9 w-9 bg-secondary p-0 text-secondary-foreground hover:bg-accent"
                          disabled={isCategorySubmitting}
                          aria-label={t(MessageKey.Edit)}
                          onClick={() => setEditingCategory({ id: category.id, name: category.name, sortOrder: category.sortOrder })}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          className="mt-0 min-h-9 w-9 bg-red-600 p-0 text-white hover:bg-red-700"
                          disabled={isCategorySubmitting}
                          aria-label={t(MessageKey.Delete)}
                          onClick={() => void handleDeleteCategory(category)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </Panel>
      </div>

      <Panel className="min-w-0">
        <div className="mb-4 grid gap-3">
          <div>
            <h2 className="m-0 text-base">{t(MessageKey.MenusListTitle)}</h2>
            {menus.length > 0 ? (
              <p className="mt-1 text-[13px] leading-normal text-muted-foreground">
                {t(MessageKey.MenusSummary, { available: visibleMenuCount, hidden: hiddenMenuCount })}
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-[minmax(280px,620px)_auto] items-center gap-3 max-[780px]:grid-cols-1">
            <label className="relative block min-w-0" htmlFor="menuSearch">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="menuSearch"
                className="min-h-12 w-full rounded-md border border-input bg-card py-2 pl-11 pr-4 text-base font-semibold text-foreground shadow-sm transition placeholder:text-muted-foreground/70 hover:border-ring/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                placeholder={t(MessageKey.MenusSearchPlaceholder)}
                type="search"
                value={menuSearch}
                onChange={(event) => setMenuSearch(event.target.value)}
              />
            </label>
            <label className="flex min-h-[38px] items-center gap-2 text-sm font-bold text-foreground">
              <input
                className="h-[18px] w-[18px]"
                type="checkbox"
                checked={showHiddenMenus}
                onChange={(event) => setShowHiddenMenus(event.target.checked)}
              />
              {t(MessageKey.MenusShowHidden)}
            </label>
          </div>
        </div>

        {menusQuery.isLoading ? <StateMessage title={t(MessageKey.MenusLoading)} /> : null}
        {menusQuery.error ? (
          <StateMessage
            title={t(MessageKey.MenusUnableToLoad)}
            description={getUserErrorMessage(menusQuery.error, MessageKey.RequestFailed, locale)}
            tone="error"
          />
        ) : null}
        {menusQuery.isSuccess && menus.length === 0 ? (
          <StateMessage title={t(MessageKey.MenusEmptyTitle)} description={t(MessageKey.MenusEmptyDescription)} />
        ) : null}
        {menus.length > 0 && filteredMenus.length === 0 ? <StateMessage title={t(MessageKey.MenusNoSearchResults)} /> : null}
        {filteredMenus.length > 0 ? (
          <div className="grid gap-5">
            {groupedPaginatedMenus.map((group) => (
              <section className="grid gap-2.5" key={group.id}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                  <h3 className="m-0 text-sm font-extrabold uppercase tracking-normal text-muted-foreground">{group.name}</h3>
                  <span className="text-xs font-bold text-muted-foreground">
                    {t(MessageKey.QrItems, { count: group.menus.length })} - #{group.sortOrder}
                  </span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-2.5">
                  {group.menus.map((menu) => (
                    <article className="grid gap-3 rounded-md border border-border bg-muted/45 p-3" key={menu.id}>
                      <div className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-md border border-border bg-muted font-extrabold text-muted-foreground" aria-label={menu.imageUrl ? menu.name : t(MessageKey.MenusNoImage)}>
                        {menu.imageUrl ? (
                          <img className="h-full w-full object-cover" src={menu.imageUrl} alt={menu.name} loading="lazy" />
                        ) : (
                          <span>{menu.name[0]}</span>
                        )}
                      </div>
                      <div className="grid min-w-0 gap-2">
                        <strong>{menu.name}</strong>
                        <span className="text-[12px] font-bold text-muted-foreground">#{menu.sortOrder}</span>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="break-words text-[13px] font-bold text-muted-foreground">{formatCurrency(menu.price)}</span>
                          <StatusPill className={menu.isActive && !menu.isOutOfStock ? "bg-secondary text-secondary-foreground" : "bg-red-100 text-red-950"}>
                            {!menu.isActive ? t(MessageKey.Hidden).toUpperCase() : menu.isOutOfStock ? t(MessageKey.MenusOutOfStockLabel).toUpperCase() : t(MessageKey.Available).toUpperCase()}
                          </StatusPill>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {menu.isFeatured ? <StatusPill className="bg-primary text-primary-foreground">{t(MessageKey.MenusFeaturedLabel)}</StatusPill> : null}
                          {menu.isNew ? <StatusPill className="bg-accent text-accent-foreground">{t(MessageKey.MenusNewLabel)}</StatusPill> : null}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1">
                        <Button
                          type="button"
                          className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                          disabled={busyMenuId === menu.id}
                          onClick={() => void handleToggleActive(menu)}
                        >
                          <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
                          {busyMenuId === menu.id
                            ? t(MessageKey.Saving)
                            : menu.isActive
                              ? t(MessageKey.MenusHideFromQr)
                              : t(MessageKey.MenusMakeAvailable)}
                        </Button>
                        <Button
                          type="button"
                          className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                          disabled={busyMenuId === menu.id}
                          onClick={() => void handleToggleStock(menu)}
                        >
                          {menu.isOutOfStock ? (
                            <PackageCheck className="mr-2 h-4 w-4" aria-hidden="true" />
                          ) : (
                            <PackageX className="mr-2 h-4 w-4" aria-hidden="true" />
                          )}
                          {busyMenuId === menu.id
                            ? t(MessageKey.Saving)
                            : menu.isOutOfStock
                              ? t(MessageKey.MenusMarkInStock)
                              : t(MessageKey.MenusMarkOutOfStock)}
                        </Button>
                        <Button
                          type="button"
                          className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                          disabled={busyMenuId === menu.id}
                          onClick={() => {
                            setFormError(null);
                            setSuccessMessage(null);
                            setEditingMenu({
                              id: menu.id,
                              name: menu.name,
                              price: menu.price,
                              imageUrl: menu.imageUrl ?? "",
                              imageFile: null,
                              categoryId: menu.categoryId,
                              isActive: menu.isActive,
                              isOutOfStock: menu.isOutOfStock,
                              isFeatured: menu.isFeatured,
                              isNew: menu.isNew,
                              sortOrder: menu.sortOrder
                            });
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                          {t(MessageKey.Edit)}
                        </Button>
                        {menu.canDelete ? (
                          <Button
                            type="button"
                            className="mt-0 min-h-9 bg-red-600 text-white hover:bg-red-700"
                            disabled={busyMenuId === menu.id || deleteMenuMutation.isPending}
                            onClick={() => void handleDelete(menu)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            {t(MessageKey.Delete)}
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
        {filteredMenus.length > menusPerPage ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
            <Button
              type="button"
              className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
              disabled={menuPage <= 1}
              onClick={() => setMenuPage((currentPage) => Math.max(1, currentPage - 1))}
            >
              {t(MessageKey.OrdersPreviousPage)}
            </Button>
            <span className="text-sm font-bold text-muted-foreground">
              {t(MessageKey.OrdersPageSummary, { page: menuPage, totalPages: totalMenuPages })}
            </span>
            <Button
              type="button"
              className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
              disabled={menuPage >= totalMenuPages}
              onClick={() => setMenuPage((currentPage) => Math.min(totalMenuPages, currentPage + 1))}
            >
              {t(MessageKey.OrdersNextPage)}
            </Button>
          </div>
        ) : null}
      </Panel>
      </section>
    </section>
  );
};
