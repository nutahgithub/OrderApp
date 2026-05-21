import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import {
  useBranchesQuery,
  useCreateBranchMutation,
  useDeleteBranchMutation,
  useUpdateBranchMutation
} from "../../features/branches/hooks";
import { branchSchema } from "../../features/branches/schemas";
import type { BranchFormValues } from "../../features/branches/schemas";
import { ApiClientError } from "../../lib/api/http";
import { formatDateTime } from "../../lib/format/date";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

type EditingBranch = {
  id: string;
  name: string;
};

export const AdminBranchesPage = () => {
  const { token, logout } = useAuth();
  const { locale, t } = useI18n();
  const [editingBranch, setEditingBranch] = useState<EditingBranch | null>(null);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<string | null>(null);
  const [pendingDeleteBranch, setPendingDeleteBranch] = useState<EditingBranch | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const branchesQuery = useBranchesQuery(token);
  const createBranchMutation = useCreateBranchMutation(token);
  const deleteBranchMutation = useDeleteBranchMutation(token);
  const updateBranchMutation = useUpdateBranchMutation(token);
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "" }
  });
  const fieldError = form.formState.errors.name?.message;
  const isSubmitting = createBranchMutation.isPending || updateBranchMutation.isPending;
  const isDeleting = deleteBranchMutation.isPending;

  useEffect(() => {
    if (!token) {
      logout();
    }
  }, [logout, token]);

  useEffect(() => {
    form.reset({ name: editingBranch?.name ?? "" });
  }, [editingBranch, form]);

  const handleSubmit = async (values: BranchFormValues) => {
    if (!token) {
      logout();
      return;
    }

    setFormError(null);
    setDeleteBlockedMessage(null);
    setSuccessMessage(null);

    try {
      if (editingBranch) {
        await updateBranchMutation.mutateAsync({ branchId: editingBranch.id, body: values });
        setEditingBranch(null);
        setSuccessMessage(t(MessageKey.BranchesUpdated));
      } else {
        await createBranchMutation.mutateAsync(values);
        form.reset({ name: "" });
        setSuccessMessage(t(MessageKey.BranchesCreated));
      }
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  const openDeleteDialog = (branch: EditingBranch) => {
    setDeleteBlockedMessage(null);
    setFormError(null);
    setSuccessMessage(null);
    setPendingDeleteBranch(branch);
  };

  const handleDelete = async () => {
    if (!token) {
      logout();
      return;
    }

    if (!pendingDeleteBranch) {
      return;
    }

    setFormError(null);
    setDeleteBlockedMessage(null);
    setSuccessMessage(null);

    try {
      await deleteBranchMutation.mutateAsync(pendingDeleteBranch.id);
      if (editingBranch?.id === pendingDeleteBranch.id) {
        setEditingBranch(null);
        form.reset({ name: "" });
      }
      setPendingDeleteBranch(null);
      setSuccessMessage(t(MessageKey.BranchesDeleted));
    } catch (error: unknown) {
      const message = getUserErrorMessage(error, MessageKey.RequestFailed, locale);

      if (error instanceof ApiClientError && error.code === "BRANCH_NOT_EMPTY") {
        setPendingDeleteBranch(null);
        setDeleteBlockedMessage(message);
      }

      setFormError(message);
    }
  };

  const branches = branchesQuery.data?.branches ?? [];
  const loadError = branchesQuery.error
    ? getUserErrorMessage(branchesQuery.error, MessageKey.RequestFailed, locale)
    : null;

  return (
    <section className="grid gap-5">
      <PageHeader eyebrow={t(MessageKey.Setup)} title={t(MessageKey.BranchesTitle)} subtitle={t(MessageKey.BranchesSubtitle)} />

      <section className="grid grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)] items-start gap-4 max-[980px]:grid-cols-1">
        <Panel className="grid gap-3 min-[981px]:sticky min-[981px]:top-7">
          <h2 className="m-0 text-base">{editingBranch ? t(MessageKey.BranchesEditTitle) : t(MessageKey.BranchesCreateTitle)}</h2>
          <p className="-mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.BranchesHint)}</p>
          <form className="grid gap-3" onSubmit={form.handleSubmit(handleSubmit)}>
            <Input
              label={t(MessageKey.BranchesNameLabel)}
              {...form.register("name")}
              placeholder={t(MessageKey.BranchesNamePlaceholder)}
            />
            <div className="flex gap-2 max-[780px]:justify-start">
              {editingBranch ? (
                <Button
                  type="button"
                  className="bg-muted text-secondary-foreground"
                  disabled={isSubmitting}
                  onClick={() => {
                    setEditingBranch(null);
                    setFormError(null);
                    form.reset({ name: "" });
                  }}
                >
                  {t(MessageKey.Cancel)}
                </Button>
              ) : null}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t(MessageKey.Saving)
                  : editingBranch
                    ? t(MessageKey.SaveChanges)
                    : t(MessageKey.BranchesCreateButton)}
              </Button>
            </div>
          </form>
          {fieldError ? <StateMessage title={t(fieldError as MessageKey)} tone="error" /> : null}
          {successMessage ? <StateMessage title={successMessage} tone="success" /> : null}
          {formError ? (
            <StateMessage title={t(MessageKey.BranchesUnableToSave)} description={formError} tone="error" />
          ) : null}
        </Panel>

        <Panel>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-base">{t(MessageKey.BranchesListTitle)}</h2>
              {branches.length > 0 ? (
                <p className="mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.BranchesTotal, { count: branches.length })}</p>
              ) : null}
            </div>
            <Button type="button" className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent" onClick={() => void branchesQuery.refetch()}>
              {t(MessageKey.Refresh)}
            </Button>
          </div>

          {branchesQuery.isLoading ? <StateMessage title={t(MessageKey.BranchesLoading)} /> : null}
          {loadError ? (
            <StateMessage title={t(MessageKey.BranchesUnableToLoad)} description={loadError} tone="error" />
          ) : null}
          {branchesQuery.isSuccess && branches.length === 0 ? (
            <StateMessage title={t(MessageKey.BranchesEmptyTitle)} description={t(MessageKey.BranchesEmptyDescription)} />
          ) : null}
          {branches.length > 0 ? (
            <div className="grid gap-2.5">
              {branches.map((branch) => (
                <article className="flex items-center justify-between gap-3.5 rounded-md border border-border bg-muted/45 p-3 max-[780px]:grid max-[780px]:grid-cols-1" key={branch.id}>
                  <div className="grid min-w-0 gap-1">
                    <strong>{branch.name}</strong>
                    <span className="break-words text-[13px] font-bold text-muted-foreground">
                      {t(MessageKey.Updated)} {formatDateTime(branch.updatedAt)}
                    </span>
                  </div>
                  <div className="flex gap-2 max-[780px]:justify-start">
                    <Button
                      type="button"
                      className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                      disabled={isDeleting}
                      onClick={() => {
                        setFormError(null);
                        setDeleteBlockedMessage(null);
                        setSuccessMessage(null);
                        setEditingBranch({ id: branch.id, name: branch.name });
                      }}
                    >
                      {t(MessageKey.Edit)}
                    </Button>
                    <Button
                      type="button"
                      className="mt-0 min-h-9 border border-destructive/35 bg-background text-destructive hover:bg-destructive/10"
                      disabled={isDeleting}
                      onClick={() => openDeleteDialog({ id: branch.id, name: branch.name })}
                    >
                      {t(MessageKey.Delete)}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </Panel>
      </section>

      {pendingDeleteBranch ? (
        <div
          className="fixed inset-0 z-20 grid place-items-center bg-foreground/40 p-5"
          role="presentation"
          onMouseDown={() => {
            if (!isDeleting) {
              setPendingDeleteBranch(null);
            }
          }}
        >
          <section
            aria-labelledby="branch-delete-confirm-title"
            aria-modal="true"
            className="grid w-[min(440px,100%)] gap-4 rounded-md border border-border bg-card p-5 text-card-foreground shadow-floating"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div>
              <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.Setup)}</p>
              <h2 className="m-0 text-lg" id="branch-delete-confirm-title">
                {t(MessageKey.BranchesDeleteConfirmTitle)}
              </h2>
            </div>
            <p className="m-0 leading-normal text-muted-foreground">
              {t(MessageKey.BranchesDeleteConfirm, { branchName: pendingDeleteBranch.name })}
            </p>
            <div className="flex items-center justify-between gap-3 max-[780px]:flex-col max-[780px]:items-stretch">
              <Button
                type="button"
                className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent max-[780px]:w-full"
                disabled={isDeleting}
                onClick={() => setPendingDeleteBranch(null)}
              >
                {t(MessageKey.Cancel)}
              </Button>
              <Button
                type="button"
                className="mt-0 min-h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90 max-[780px]:w-full"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
              >
                {isDeleting ? t(MessageKey.BranchesDeleting) : t(MessageKey.Delete)}
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {deleteBlockedMessage ? (
        <div
          className="fixed inset-0 z-20 grid place-items-center bg-foreground/40 p-5"
          role="presentation"
          onMouseDown={() => setDeleteBlockedMessage(null)}
        >
          <section
            aria-labelledby="branch-delete-blocked-title"
            aria-modal="true"
            className="grid w-[min(420px,100%)] gap-4 rounded-md border border-border bg-card p-5 text-card-foreground shadow-floating"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div>
              <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.Setup)}</p>
              <h2 className="m-0 text-lg" id="branch-delete-blocked-title">
                {t(MessageKey.BranchesDeleteBlockedTitle)}
              </h2>
            </div>
            <StateMessage title={deleteBlockedMessage} tone="error" />
            <div className="flex justify-end">
              <Button
                type="button"
                className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                onClick={() => setDeleteBlockedMessage(null)}
              >
                {t(MessageKey.Continue)}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
};
