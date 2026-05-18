import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { useBranchesQuery, useCreateBranchMutation, useUpdateBranchMutation } from "../../features/branches/hooks";
import { branchSchema } from "../../features/branches/schemas";
import type { BranchFormValues } from "../../features/branches/schemas";
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
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const branchesQuery = useBranchesQuery(token);
  const createBranchMutation = useCreateBranchMutation(token);
  const updateBranchMutation = useUpdateBranchMutation(token);
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: "" }
  });
  const fieldError = form.formState.errors.name?.message;
  const isSubmitting = createBranchMutation.isPending || updateBranchMutation.isPending;

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

  const branches = branchesQuery.data?.branches ?? [];
  const loadError = branchesQuery.error
    ? getUserErrorMessage(branchesQuery.error, MessageKey.RequestFailed, locale)
    : null;

  return (
    <section className="grid gap-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.Setup)}</p>
          <h1 className="m-0 text-[28px] leading-tight">{t(MessageKey.BranchesTitle)}</h1>
          <p className="mb-0 mt-2 text-muted-foreground">{t(MessageKey.BranchesSubtitle)}</p>
        </div>
      </header>

      <section className="grid gap-3 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
        <h2 className="m-0 text-base">{editingBranch ? t(MessageKey.BranchesEditTitle) : t(MessageKey.BranchesCreateTitle)}</h2>
        <p className="-mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.BranchesHint)}</p>
        <form className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 max-[780px]:grid-cols-1 max-[780px]:items-stretch" onSubmit={form.handleSubmit(handleSubmit)}>
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
      </section>

      <section className="rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
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
                    {t(MessageKey.Updated)} {new Date(branch.updatedAt).toLocaleString(locale)}
                  </span>
                </div>
                <Button
                  type="button"
                  className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                  onClick={() => {
                    setFormError(null);
                    setSuccessMessage(null);
                    setEditingBranch({ id: branch.id, name: branch.name });
                  }}
                >
                  {t(MessageKey.Edit)}
                </Button>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
};
