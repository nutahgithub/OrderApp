import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, ShieldCheck, UserCog } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { SelectField } from "../../components/ui/SelectField";
import { StateMessage } from "../../components/ui/StateMessage";
import { StatusPill } from "../../components/ui/StatusPill";
import {
  useAdminUsersQuery,
  useCreateAdminUserMutation,
  useResetAdminPasswordMutation,
  useUpdateAdminUserMutation
} from "../../features/admin-users/hooks";
import {
  adminUserEditSchema,
  adminUserPasswordSchema,
  adminUserSchema,
  type AdminUserEditFormValues,
  type AdminUserFormValues,
  type AdminUserPasswordFormValues
} from "../../features/admin-users/schemas";
import { useAuth } from "../../features/auth/AuthContext";
import type { AdminRole, AdminUser } from "../../lib/api/types";
import { formatDateTime } from "../../lib/format/date";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

const roleOrder: AdminRole[] = ["OWNER", "MANAGER", "STAFF"];

const roleMessageKey: Record<AdminRole, MessageKey> = {
  OWNER: MessageKey.AdminRoleOwner,
  MANAGER: MessageKey.AdminRoleManager,
  STAFF: MessageKey.AdminRoleStaff
};

const canManageRole = (actorRole: AdminRole | undefined, targetRole: AdminRole): boolean => {
  return actorRole === "OWNER" || targetRole === "STAFF";
};

export const AdminUsersPage = () => {
  const { admin, token, logout } = useAuth();
  const { locale, t } = useI18n();
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [passwordAdmin, setPasswordAdmin] = useState<AdminUser | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const adminUsersQuery = useAdminUsersQuery(token);
  const createAdminUserMutation = useCreateAdminUserMutation(token);
  const updateAdminUserMutation = useUpdateAdminUserMutation(token);
  const resetPasswordMutation = useResetAdminPasswordMutation(token);
  const form = useForm<AdminUserFormValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: "STAFF"
    }
  });
  const editForm = useForm<AdminUserEditFormValues>({
    resolver: zodResolver(adminUserEditSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "STAFF",
      isActive: true
    }
  });
  const passwordForm = useForm<AdminUserPasswordFormValues>({
    resolver: zodResolver(adminUserPasswordSchema),
    defaultValues: {
      password: ""
    }
  });
  const isSubmitting = createAdminUserMutation.isPending || updateAdminUserMutation.isPending;
  const isResettingPassword = resetPasswordMutation.isPending;
  const adminUsers = adminUsersQuery.data?.adminUsers ?? [];
  const loadError = adminUsersQuery.error ? getUserErrorMessage(adminUsersQuery.error, MessageKey.AdminUsersUnableToLoad, locale) : null;
  const roleOptions = useMemo(
    () =>
      roleOrder
        .filter((role) => canManageRole(admin?.role, role))
        .map((role) => ({
          label: t(roleMessageKey[role]),
          value: role
        })),
    [admin?.role, t]
  );

  useEffect(() => {
    if (!token) {
      logout();
    }
  }, [logout, token]);

  useEffect(() => {
    if (editingAdmin) {
      editForm.reset({
        email: editingAdmin.email,
        name: editingAdmin.name,
        role: editingAdmin.role,
        isActive: editingAdmin.isActive
      });
    }
  }, [editForm, editingAdmin]);

  const handleCreate = async (values: AdminUserFormValues) => {
    if (!token) {
      logout();
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    try {
      await createAdminUserMutation.mutateAsync(values);
      form.reset({ email: "", name: "", password: "", role: "STAFF" });
      setSuccessMessage(t(MessageKey.AdminUsersCreated));
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.AdminUsersUnableToSave, locale));
    }
  };

  const handleEdit = async (values: AdminUserEditFormValues) => {
    if (!token || !editingAdmin) {
      logout();
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    try {
      await updateAdminUserMutation.mutateAsync({
        adminId: editingAdmin.id,
        body: values
      });
      setEditingAdmin(null);
      setSuccessMessage(t(MessageKey.AdminUsersUpdated));
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.AdminUsersUnableToSave, locale));
    }
  };

  const handleToggleActive = async (target: AdminUser) => {
    if (!token) {
      logout();
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    try {
      await updateAdminUserMutation.mutateAsync({
        adminId: target.id,
        body: {
          isActive: !target.isActive
        }
      });
      setSuccessMessage(t(MessageKey.AdminUsersUpdated));
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.AdminUsersUnableToSave, locale));
    }
  };

  const handleResetPassword = async (values: AdminUserPasswordFormValues) => {
    if (!token || !passwordAdmin) {
      logout();
      return;
    }

    setPasswordError(null);
    setSuccessMessage(null);

    try {
      await resetPasswordMutation.mutateAsync({
        adminId: passwordAdmin.id,
        body: values
      });
      setPasswordAdmin(null);
      passwordForm.reset({ password: "" });
      setSuccessMessage(t(MessageKey.AdminUsersPasswordReset));
    } catch (error: unknown) {
      setPasswordError(getUserErrorMessage(error, MessageKey.AdminUsersUnableToResetPassword, locale));
    }
  };

  const createFieldError = form.formState.errors.email?.message ?? form.formState.errors.name?.message ?? form.formState.errors.password?.message;
  const editFieldError = editForm.formState.errors.email?.message ?? editForm.formState.errors.name?.message;
  const passwordFieldError = passwordForm.formState.errors.password?.message;

  return (
    <section className="grid gap-5">
      <PageHeader eyebrow={t(MessageKey.AdminUsersEyebrow)} title={t(MessageKey.AdminUsersTitle)} subtitle={t(MessageKey.AdminUsersSubtitle)} />

      <section className="grid grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] items-start gap-4 max-[980px]:grid-cols-1">
        <Panel className="grid gap-3 min-[981px]:sticky min-[981px]:top-7">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="m-0 text-base">{editingAdmin ? t(MessageKey.AdminUsersEditTitle) : t(MessageKey.AdminUsersCreateTitle)}</h2>
          </div>
          <p className="-mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.AdminUsersHint)}</p>

          {editingAdmin ? (
            <form className="grid gap-3" onSubmit={editForm.handleSubmit(handleEdit)}>
              <Input label={t(MessageKey.AdminUsersNameLabel)} {...editForm.register("name")} />
              <Input label={t(MessageKey.Email)} type="email" {...editForm.register("email")} />
              <SelectField
                label={t(MessageKey.AdminUsersRoleLabel)}
                options={roleOptions}
                value={editForm.watch("role")}
                onValueChange={(value) => editForm.setValue("role", value as AdminRole, { shouldDirty: true, shouldValidate: true })}
              />
              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <input className="h-4 w-4 accent-primary" type="checkbox" {...editForm.register("isActive")} />
                {editForm.watch("isActive") ? t(MessageKey.AdminUsersActive) : t(MessageKey.AdminUsersInactive)}
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="bg-muted text-secondary-foreground"
                  disabled={isSubmitting}
                  onClick={() => {
                    setEditingAdmin(null);
                    setFormError(null);
                  }}
                >
                  {t(MessageKey.Cancel)}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t(MessageKey.Saving) : t(MessageKey.SaveChanges)}
                </Button>
              </div>
            </form>
          ) : (
            <form className="grid gap-3" onSubmit={form.handleSubmit(handleCreate)}>
              <Input label={t(MessageKey.AdminUsersNameLabel)} placeholder={t(MessageKey.AdminUsersNamePlaceholder)} {...form.register("name")} />
              <Input label={t(MessageKey.Email)} placeholder={t(MessageKey.AdminUsersEmailPlaceholder)} type="email" {...form.register("email")} />
              <Input
                label={t(MessageKey.AdminUsersPasswordLabel)}
                placeholder={t(MessageKey.AdminUsersPasswordPlaceholder)}
                type="password"
                {...form.register("password")}
              />
              <SelectField
                label={t(MessageKey.AdminUsersRoleLabel)}
                options={roleOptions}
                value={form.watch("role")}
                onValueChange={(value) => form.setValue("role", value as AdminRole, { shouldDirty: true, shouldValidate: true })}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t(MessageKey.Saving) : t(MessageKey.AdminUsersCreateButton)}
              </Button>
            </form>
          )}
          {createFieldError ? <StateMessage title={t(createFieldError as MessageKey)} tone="error" /> : null}
          {editFieldError ? <StateMessage title={t(editFieldError as MessageKey)} tone="error" /> : null}
          {successMessage ? <StateMessage title={successMessage} tone="success" /> : null}
          {formError ? <StateMessage title={t(MessageKey.AdminUsersUnableToSave)} description={formError} tone="error" /> : null}
        </Panel>

        <Panel>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-base">{t(MessageKey.AdminUsersListTitle)}</h2>
              {adminUsers.length > 0 ? (
                <p className="mt-1 text-[13px] leading-normal text-muted-foreground">
                  {t(MessageKey.AdminUsersTotal, { count: adminUsers.length })}
                </p>
              ) : null}
            </div>
            <Button type="button" className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent" onClick={() => void adminUsersQuery.refetch()}>
              {t(MessageKey.Refresh)}
            </Button>
          </div>

          {adminUsersQuery.isLoading ? <StateMessage title={t(MessageKey.AdminUsersLoading)} /> : null}
          {loadError ? <StateMessage title={t(MessageKey.AdminUsersUnableToLoad)} description={loadError} tone="error" /> : null}
          {adminUsersQuery.isSuccess && adminUsers.length === 0 ? (
            <StateMessage title={t(MessageKey.AdminUsersEmptyTitle)} description={t(MessageKey.AdminUsersEmptyDescription)} />
          ) : null}
          <div className="grid gap-2.5">
            {adminUsers.map((adminUser) => {
              const isSelf = adminUser.id === admin?.id;
              const canManage = canManageRole(admin?.role, adminUser.role);

              return (
                <article className="grid gap-3 rounded-md border border-border bg-muted/45 p-3" key={adminUser.id}>
                  <div className="flex items-start justify-between gap-3 max-[780px]:grid">
                    <div className="grid min-w-0 gap-1">
                      <strong className="break-words">{adminUser.name}</strong>
                      <span className="break-words text-sm text-muted-foreground">{adminUser.email}</span>
                      <span className="text-[13px] font-bold text-muted-foreground">
                        {t(MessageKey.Updated)} {formatDateTime(adminUser.updatedAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 max-[780px]:justify-start">
                      <StatusPill>
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {t(roleMessageKey[adminUser.role])}
                      </StatusPill>
                      <StatusPill className={adminUser.isActive ? "border-success/45 bg-success/10 text-success" : "border-muted-foreground/25 bg-muted text-muted-foreground"}>
                        {adminUser.isActive ? t(MessageKey.AdminUsersActive) : t(MessageKey.AdminUsersInactive)}
                      </StatusPill>
                    </div>
                  </div>
                  {isSelf ? <StateMessage title={t(MessageKey.AdminUsersSelfProtected)} /> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                      disabled={!canManage}
                      onClick={() => {
                        setEditingAdmin(adminUser);
                        setFormError(null);
                        setSuccessMessage(null);
                      }}
                    >
                      {t(MessageKey.Edit)}
                    </Button>
                    <Button
                      type="button"
                      className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                      disabled={!canManage}
                      onClick={() => {
                        setPasswordAdmin(adminUser);
                        passwordForm.reset({ password: "" });
                        setPasswordError(null);
                      }}
                    >
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      {t(MessageKey.AdminUsersResetPassword)}
                    </Button>
                    <Button
                      type="button"
                      className="mt-0 min-h-9 border border-destructive/35 bg-background text-destructive hover:bg-destructive/10 disabled:text-muted-foreground"
                      disabled={!canManage || isSelf || updateAdminUserMutation.isPending}
                      onClick={() => void handleToggleActive(adminUser)}
                    >
                      {adminUser.isActive ? t(MessageKey.AdminUsersDisable) : t(MessageKey.AdminUsersEnable)}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>
      </section>

      {passwordAdmin ? (
        <div
          className="fixed inset-0 z-20 grid place-items-center bg-foreground/40 p-5"
          role="presentation"
          onMouseDown={() => {
            if (!isResettingPassword) {
              setPasswordAdmin(null);
            }
          }}
        >
          <section
            aria-labelledby="admin-password-reset-title"
            aria-modal="true"
            className="grid w-[min(420px,100%)] gap-4 rounded-md border border-border bg-card p-5 text-card-foreground shadow-floating"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div>
              <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.AdminUsersEyebrow)}</p>
              <h2 className="m-0 text-lg" id="admin-password-reset-title">
                {t(MessageKey.AdminUsersResetPasswordTitle)}
              </h2>
            </div>
            <p className="m-0 leading-normal text-muted-foreground">
              {t(MessageKey.AdminUsersResetPasswordDescription, { name: passwordAdmin.name })}
            </p>
            <form className="grid gap-3" onSubmit={passwordForm.handleSubmit(handleResetPassword)}>
              <Input
                label={t(MessageKey.AdminUsersPasswordLabel)}
                placeholder={t(MessageKey.AdminUsersPasswordPlaceholder)}
                type="password"
                {...passwordForm.register("password")}
              />
              {passwordFieldError ? <StateMessage title={t(passwordFieldError as MessageKey)} tone="error" /> : null}
              {passwordError ? <StateMessage title={t(MessageKey.AdminUsersUnableToResetPassword)} description={passwordError} tone="error" /> : null}
              <div className="flex justify-between gap-3 max-[780px]:grid">
                <Button
                  type="button"
                  className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                  disabled={isResettingPassword}
                  onClick={() => setPasswordAdmin(null)}
                >
                  {t(MessageKey.Cancel)}
                </Button>
                <Button type="submit" className="mt-0 min-h-9" disabled={isResettingPassword}>
                  {isResettingPassword ? t(MessageKey.Saving) : t(MessageKey.AdminUsersResetPassword)}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
};
