import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { StateMessage } from "../../components/ui/StateMessage";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAuth } from "../../features/auth/AuthContext";
import {
  useCreateMenuMutation,
  useDeleteMenuMutation,
  useMenusQuery,
  useUpdateMenuMutation,
  useUploadMenuImageMutation
} from "../../features/menus/hooks";
import { menuSchema } from "../../features/menus/schemas";
import type { Menu } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

type EditingMenu = {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  imageFile: File | null;
  isActive: boolean;
};

const maxCompressedImageBytes = 1_000_000;
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
  if (!file.type.startsWith("image/")) {
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
  const createMenuMutation = useCreateMenuMutation(token);
  const updateMenuMutation = useUpdateMenuMutation(token);
  const deleteMenuMutation = useDeleteMenuMutation(token);
  const uploadMenuImageMutation = useUploadMenuImageMutation(token);
  const menuImageInputRef = useRef<HTMLInputElement | null>(null);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuImageFile, setNewMenuImageFile] = useState<File | null>(null);
  const [newMenuIsActive, setNewMenuIsActive] = useState(true);
  const [editingMenu, setEditingMenu] = useState<EditingMenu | null>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [showHiddenMenus, setShowHiddenMenus] = useState(true);
  const [menuPage, setMenuPage] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorTitle, setFormErrorTitle] = useState<MessageKey>(MessageKey.MenusUnableToSave);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busyMenuId, setBusyMenuId] = useState<string | null>(null);

  const menus = menusQuery.data?.menus ?? [];
  const visibleMenuCount = menus.filter((menu) => menu.isActive).length;
  const hiddenMenuCount = menus.length - visibleMenuCount;
  const isSubmitting = createMenuMutation.isPending || updateMenuMutation.isPending || uploadMenuImageMutation.isPending;
  const normalizedMenuSearch = normalizeMenuSearchText(menuSearch.trim());
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const matchesStatus = showHiddenMenus || menu.isActive;
      const matchesSearch = normalizedMenuSearch === "" || normalizeMenuSearchText(menu.name).includes(normalizedMenuSearch);

      return matchesStatus && matchesSearch;
    });
  }, [menus, normalizedMenuSearch, showHiddenMenus]);
  const totalMenuPages = Math.max(1, Math.ceil(filteredMenus.length / menusPerPage));
  const paginatedMenus = filteredMenus.slice((menuPage - 1) * menusPerPage, menuPage * menusPerPage);

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
    setNewMenuIsActive(true);
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
      isActive: newMenuIsActive
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
        isActive: parsed.data.isActive
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
        isActive: parsed.data.isActive
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
        isActive: !menu.isActive
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
  const formIsActive = editingMenu ? editingMenu.isActive : newMenuIsActive;

  return (
    <section className="grid gap-5">
      <PageHeader eyebrow={t(MessageKey.Setup)} title={t(MessageKey.MenusTitle)} subtitle={t(MessageKey.MenusSubtitle)} />

      <section className="grid grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)] items-start gap-4 max-[1100px]:grid-cols-1">
      <Panel className="grid gap-3 min-[1101px]:sticky min-[1101px]:top-7">
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
              <span className="flex-none text-sm font-extrabold text-muted-foreground">đ</span>
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
          <label className="flex min-h-[42px] items-center gap-2 text-sm font-bold text-foreground max-[1100px]:justify-start">
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
          <div className="flex gap-2 max-[1100px]:justify-start">
            {editingMenu ? (
              <Button type="button" className="bg-muted text-secondary-foreground" disabled={isSubmitting} onClick={resetForm}>
                {t(MessageKey.Cancel)}
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
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

      <Panel>
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
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-2.5">
            {paginatedMenus.map((menu) => (
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="break-words text-[13px] font-bold text-muted-foreground">{formatCurrency(menu.price)}</span>
                    <StatusPill className={menu.isActive ? "bg-secondary text-secondary-foreground" : "bg-red-100 text-red-950"}>
                      {menu.isActive ? t(MessageKey.Available).toUpperCase() : t(MessageKey.Hidden).toUpperCase()}
                    </StatusPill>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1">
                  <Button
                    type="button"
                    className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                    disabled={busyMenuId === menu.id}
                    onClick={() => void handleToggleActive(menu)}
                  >
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
                    onClick={() => {
                      setFormError(null);
                      setSuccessMessage(null);
                      setEditingMenu({
                        id: menu.id,
                        name: menu.name,
                        price: menu.price,
                        imageUrl: menu.imageUrl ?? "",
                        imageFile: null,
                        isActive: menu.isActive
                      });
                    }}
                  >
                    {t(MessageKey.Edit)}
                  </Button>
                  {menu.canDelete ? (
                    <Button
                      type="button"
                      className="mt-0 min-h-9 bg-red-600 text-white hover:bg-red-700"
                      disabled={busyMenuId === menu.id || deleteMenuMutation.isPending}
                      onClick={() => void handleDelete(menu)}
                    >
                      {t(MessageKey.Delete)}
                    </Button>
                  ) : null}
                </div>
              </article>
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
