import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import type { Menu } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

type MenusState =
  | { status: "loading" }
  | { status: "success"; menus: Menu[] }
  | { status: "error"; message: string };

type EditingMenu = {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  imageFile: File | null;
  isActive: boolean;
};

const pricePattern = /^\d+(\.\d{1,2})?$/;
const maxCompressedImageBytes = 1_000_000;

const validatePrice = (price: string, translate: (key: MessageKey) => string): string | null => {
  const trimmedPrice = price.trim();

  if (!pricePattern.test(trimmedPrice)) {
    return translate(MessageKey.MenusPriceInvalidFormat);
  }

  if (Number(trimmedPrice) <= 0) {
    return translate(MessageKey.MenusPriceGreaterThanZero);
  }

  return null;
};

const formatCurrency = (price: string): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
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
  const [menusState, setMenusState] = useState<MenusState>({ status: "loading" });
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuImageFile, setNewMenuImageFile] = useState<File | null>(null);
  const [newMenuIsActive, setNewMenuIsActive] = useState(true);
  const [editingMenu, setEditingMenu] = useState<EditingMenu | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyMenuId, setBusyMenuId] = useState<string | null>(null);

  const menus = menusState.status === "success" ? menusState.menus : [];
  const visibleMenuCount = menus.filter((menu) => menu.isActive).length;
  const hiddenMenuCount = menus.length - visibleMenuCount;

  const loadMenus = useCallback(async () => {
    if (!token) {
      setMenusState({ status: "error", message: t(MessageKey.AuthSessionExpired) });
      logout();
      return;
    }

    setMenusState({ status: "loading" });

    try {
      const response = await apiClient.listMenus(token);
      setMenusState({ status: "success", menus: response.menus });
    } catch (error: unknown) {
      setMenusState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
    }
  }, [locale, logout, t, token]);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus]);

  const resetForm = () => {
    setEditingMenu(null);
    setNewMenuName("");
    setNewMenuPrice("");
    setNewMenuImageFile(null);
    setNewMenuIsActive(true);
    setFormError(null);
  };

  const uploadSelectedImage = async (authToken: string, imageFile: File | null): Promise<string | null> => {
    if (!imageFile) {
      return null;
    }

    const uploadInput = await compressImageForUpload(imageFile, t);
    const response = await apiClient.uploadMenuImage(authToken, uploadInput);

    return response.upload.url;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      logout();
      return;
    }

    const priceError = validatePrice(newMenuPrice, t);

    if (priceError) {
      setFormError(priceError);
      setSuccessMessage(null);
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const uploadedImageUrl = await uploadSelectedImage(token, newMenuImageFile);
      await apiClient.createMenu(token, {
        name: newMenuName,
        price: newMenuPrice.trim(),
        imageUrl: uploadedImageUrl,
        isActive: newMenuIsActive
      });
      resetForm();
      await loadMenus();
      setSuccessMessage(t(MessageKey.MenusCreated));
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !editingMenu) {
      logout();
      return;
    }

    const priceError = validatePrice(editingMenu.price, t);

    if (priceError) {
      setFormError(priceError);
      setSuccessMessage(null);
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const uploadedImageUrl = editingMenu.imageFile ? await uploadSelectedImage(token, editingMenu.imageFile) : null;
      await apiClient.updateMenu(token, editingMenu.id, {
        name: editingMenu.name,
        price: editingMenu.price.trim(),
        imageUrl: uploadedImageUrl ?? (editingMenu.imageUrl || null),
        isActive: editingMenu.isActive
      });
      resetForm();
      await loadMenus();
      setSuccessMessage(t(MessageKey.MenusUpdated));
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setIsSubmitting(false);
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
      await apiClient.updateMenu(token, menu.id, {
        name: menu.name,
        price: menu.price,
        imageUrl: menu.imageUrl,
        isActive: !menu.isActive
      });
      await loadMenus();
      setSuccessMessage(menu.isActive ? t(MessageKey.MenusHiddenFromQr) : t(MessageKey.MenusAvailableToQr));
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setBusyMenuId(null);
    }
  };

  const formName = editingMenu ? editingMenu.name : newMenuName;
  const formPrice = editingMenu ? editingMenu.price : newMenuPrice;
  const formImageFile = editingMenu ? editingMenu.imageFile : newMenuImageFile;
  const formIsActive = editingMenu ? editingMenu.isActive : newMenuIsActive;

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t(MessageKey.Setup)}</p>
          <h1>{t(MessageKey.MenusTitle)}</h1>
          <p className="page-subtitle">{t(MessageKey.MenusSubtitle)}</p>
        </div>
      </header>

      <section className="panel branch-form-panel">
        <h2>{editingMenu ? t(MessageKey.MenusEditTitle) : t(MessageKey.MenusCreateTitle)}</h2>
        <p className="form-hint">{t(MessageKey.MenusHint)}</p>
        <form className="menu-form" onSubmit={editingMenu ? handleUpdate : handleCreate}>
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
          <Input
            label={t(MessageKey.MenusPriceLabel)}
            name="menuPrice"
            inputMode="decimal"
            placeholder={t(MessageKey.MenusPricePlaceholder)}
            value={formPrice}
            onChange={(event) => {
              if (editingMenu) {
                setEditingMenu({ ...editingMenu, price: event.target.value });
              } else {
                setNewMenuPrice(event.target.value);
              }
            }}
            required
          />
          <label className="field">
            <span>{t(MessageKey.MenusImageLabel)}</span>
            <input
              name="menuImage"
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
            <span className="field-hint">
              {formImageFile
                ? t(MessageKey.MenusImageSelected, { fileName: formImageFile.name })
                : t(MessageKey.MenusImageHint)}
            </span>
          </label>
          <label className="toggle-field">
            <input
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
          <div className="branch-form-actions">
            {editingMenu ? (
              <Button type="button" className="button--ghost" disabled={isSubmitting} onClick={resetForm}>
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
          <StateMessage title={t(MessageKey.MenusUnableToSave)} description={formError} tone="error" />
        ) : null}
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h2>{t(MessageKey.MenusListTitle)}</h2>
            {menus.length > 0 ? (
              <p className="section-subtitle">
                {t(MessageKey.MenusSummary, { available: visibleMenuCount, hidden: hiddenMenuCount })}
              </p>
            ) : null}
          </div>
          <Button type="button" className="button--secondary button--inline" onClick={() => void loadMenus()}>
            {t(MessageKey.Refresh)}
          </Button>
        </div>

        {menusState.status === "loading" ? <StateMessage title={t(MessageKey.MenusLoading)} /> : null}
        {menusState.status === "error" ? (
          <StateMessage title={t(MessageKey.MenusUnableToLoad)} description={menusState.message} tone="error" />
        ) : null}
        {menusState.status === "success" && menus.length === 0 ? (
          <StateMessage title={t(MessageKey.MenusEmptyTitle)} description={t(MessageKey.MenusEmptyDescription)} />
        ) : null}
        {menus.length > 0 ? (
          <div className="menu-list">
            {menus.map((menu) => (
              <article className="menu-row" key={menu.id}>
                <div className="menu-thumb" aria-label={menu.imageUrl ? menu.name : t(MessageKey.MenusNoImage)}>
                  {menu.imageUrl ? <img src={menu.imageUrl} alt={menu.name} loading="lazy" /> : <span>{menu.name[0]}</span>}
                </div>
                <div className="menu-row-main">
                  <strong>{menu.name}</strong>
                  <span>{formatCurrency(menu.price)}</span>
                  <span className={`status-pill ${menu.isActive ? "" : "status-pill--disabled"}`}>
                    {menu.isActive ? t(MessageKey.Available).toUpperCase() : t(MessageKey.Hidden).toUpperCase()}
                  </span>
                </div>
                <div className="menu-row-actions">
                  <Button
                    type="button"
                    className="button--secondary button--inline"
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
                    className="button--secondary button--inline"
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
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
};
