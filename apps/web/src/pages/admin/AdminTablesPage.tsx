import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { useBranchesQuery } from "../../features/branches/hooks";
import { useCreateTableMutation, useTablesQuery, useUpdateTableMutation } from "../../features/tables/hooks";
import { tableSchema } from "../../features/tables/schemas";
import type { TableFormValues } from "../../features/tables/schemas";
import { getTableStatusLabelKey } from "../../features/shared/labels";
import type { TableStatus } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { getTableStatusClassName, statusPillClassName } from "../../lib/theme/status-colors";
import { cn } from "../../lib/utils/cn";

type EditingTable = {
  id: string;
  name: string;
  status: TableStatus;
};

const tableStatusOptions: TableStatus[] = ["AVAILABLE", "OCCUPIED", "DISABLED"];

export const AdminTablesPage = () => {
  const { token, logout } = useAuth();
  const { locale, t } = useI18n();
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [editingTable, setEditingTable] = useState<EditingTable | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const branchesQuery = useBranchesQuery(token);
  const tablesQuery = useTablesQuery(token, selectedBranchId);
  const createTableMutation = useCreateTableMutation(token);
  const updateTableMutation = useUpdateTableMutation(token, selectedBranchId);
  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      branchId: "",
      name: "",
      status: "AVAILABLE"
    }
  });
  const isSubmitting = createTableMutation.isPending || updateTableMutation.isPending;

  const branches = branchesQuery.data?.branches ?? [];
  const tables = tablesQuery.data?.tables ?? [];

  const selectedBranch = useMemo(() => {
    return branches.find((branch) => branch.id === selectedBranchId) ?? null;
  }, [branches, selectedBranchId]);

  useEffect(() => {
    if (!token) {
      logout();
    }
  }, [logout, token]);

  useEffect(() => {
    if (!selectedBranchId && branches[0]) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  useEffect(() => {
    form.reset({
      branchId: selectedBranchId,
      name: editingTable?.name ?? "",
      status: editingTable?.status ?? "AVAILABLE"
    });
  }, [editingTable, form, selectedBranchId]);

  const resetForm = () => {
    setEditingTable(null);
    form.reset({ branchId: selectedBranchId, name: "", status: "AVAILABLE" });
    setFormError(null);
  };

  const handleSubmit = async (values: TableFormValues) => {
    if (!token) {
      logout();
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    try {
      if (editingTable) {
        await updateTableMutation.mutateAsync({
          tableId: editingTable.id,
          body: { name: values.name, status: values.status }
        });
        resetForm();
        setSuccessMessage(t(MessageKey.TablesUpdated));
      } else {
        await createTableMutation.mutateAsync({
          branchId: values.branchId,
          name: values.name,
          status: values.status
        });
        resetForm();
        setSuccessMessage(t(MessageKey.TablesCreated));
      }
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    }
  };

  const handleCopyQrUrl = async (qrUrl: string) => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopyMessage(t(MessageKey.TablesQrCopied));
    } catch {
      setCopyMessage(t(MessageKey.TablesCopyUnavailable));
    }
  };

  const getTableStatusLabel = (status: TableStatus): string => {
    return t(getTableStatusLabelKey(status));
  };
  const branchesError = branchesQuery.error
    ? getUserErrorMessage(branchesQuery.error, MessageKey.RequestFailed, locale)
    : null;
  const tablesError = tablesQuery.error ? getUserErrorMessage(tablesQuery.error, MessageKey.RequestFailed, locale) : null;

  return (
    <section className="grid gap-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-1.5 mt-0 text-xs font-bold uppercase text-muted-foreground">{t(MessageKey.Setup)}</p>
          <h1 className="m-0 text-[28px] leading-tight">{t(MessageKey.TablesTitle)}</h1>
          <p className="mb-0 mt-2 text-muted-foreground">{t(MessageKey.TablesSubtitle)}</p>
        </div>
      </header>

      <section className="grid grid-cols-[minmax(0,320px)_auto] items-end gap-3 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel max-[780px]:grid-cols-1 max-[780px]:items-stretch">
        <label className="grid gap-1.5 text-sm font-semibold text-foreground">
          {t(MessageKey.Branch)}
          <select
            className="min-h-[42px] w-full rounded-md border border-input bg-card px-2.5 py-2 text-foreground"
            value={selectedBranchId}
            onChange={(event) => {
              resetForm();
              setSelectedBranchId(event.target.value);
            }}
            disabled={branches.length === 0}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent" onClick={() => void branchesQuery.refetch()}>
          {t(MessageKey.Refresh)}
        </Button>
      </section>

      {branchesQuery.isLoading ? <StateMessage title={t(MessageKey.TablesLoadingBranches)} /> : null}
      {branchesError ? (
        <StateMessage title={t(MessageKey.TablesUnableToLoadBranches)} description={branchesError} tone="error" />
      ) : null}
      {branchesQuery.isSuccess && branches.length === 0 ? (
        <StateMessage
          title={t(MessageKey.TablesNoBranchesTitle)}
          description={t(MessageKey.TablesNoBranchesDescription)}
        />
      ) : null}

      {selectedBranch ? (
        <section className="grid gap-3 rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
          <h2 className="m-0 text-base">
            {editingTable
              ? t(MessageKey.TablesEditTitle)
              : t(MessageKey.TablesCreateTitle, { branchName: selectedBranch.name })}
          </h2>
          <p className="-mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.TablesHint)}</p>
          <form className="grid grid-cols-[minmax(0,1fr)_180px_auto] items-end gap-3 max-[780px]:grid-cols-1 max-[780px]:items-stretch" onSubmit={form.handleSubmit(handleSubmit)}>
            <Input
              label={t(MessageKey.TablesNameLabel)}
              placeholder={t(MessageKey.TablesNamePlaceholder)}
              {...form.register("name")}
            />
            <label className="grid gap-1.5 text-sm font-semibold text-foreground">
              {t(MessageKey.Status)}
              <select
                className="min-h-[42px] w-full rounded-md border border-input bg-card px-2.5 py-2 text-foreground"
                {...form.register("status")}
              >
                {tableStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getTableStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2 max-[780px]:justify-start">
              {editingTable ? (
                <Button type="button" className="bg-muted text-secondary-foreground" disabled={isSubmitting} onClick={resetForm}>
                  {t(MessageKey.Cancel)}
                </Button>
              ) : null}
              <Button type="submit" disabled={isSubmitting || !selectedBranchId}>
                {isSubmitting
                  ? t(MessageKey.Saving)
                  : editingTable
                    ? t(MessageKey.SaveChanges)
                    : t(MessageKey.TablesCreateButton)}
              </Button>
            </div>
          </form>
          {successMessage ? <StateMessage title={successMessage} tone="success" /> : null}
          {formError ? (
            <StateMessage title={t(MessageKey.TablesUnableToSave)} description={formError} tone="error" />
          ) : null}
        </section>
      ) : null}

      <section className="rounded-md border border-border bg-card p-[18px] text-card-foreground shadow-panel">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-base">{t(MessageKey.TablesListTitle)}</h2>
            {tables.length > 0 ? (
              <p className="mt-1 text-[13px] leading-normal text-muted-foreground">{t(MessageKey.TablesTotal, { count: tables.length })}</p>
            ) : null}
          </div>
          <Button
            type="button"
            className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
            disabled={!selectedBranchId}
            onClick={() => void tablesQuery.refetch()}
          >
            {t(MessageKey.Refresh)}
          </Button>
        </div>

        {copyMessage ? <StateMessage title={copyMessage} tone="success" /> : null}
        {!selectedBranchId ? <StateMessage title={t(MessageKey.TablesSelectBranch)} /> : null}
        {tablesQuery.isLoading ? <StateMessage title={t(MessageKey.TablesLoading)} /> : null}
        {tablesError ? (
          <StateMessage title={t(MessageKey.TablesUnableToLoad)} description={tablesError} tone="error" />
        ) : null}
        {tablesQuery.isSuccess && tables.length === 0 ? (
          <StateMessage title={t(MessageKey.TablesEmptyTitle)} description={t(MessageKey.TablesEmptyDescription)} />
        ) : null}
        {tables.length > 0 ? (
          <div className="grid gap-2.5">
            {tables.map((table) => (
              <article className="grid gap-2.5 rounded-md border border-border bg-muted/45 p-3" key={table.id}>
                <div className="flex min-w-0 items-center gap-2.5 max-[780px]:items-start">
                  <strong>{table.name}</strong>
                  <span className={cn(statusPillClassName, getTableStatusClassName(table.status))}>
                    {getTableStatusLabel(table.status)}
                  </span>
                  <span className="break-words text-[13px] font-bold text-muted-foreground">
                    {t(MessageKey.Updated)} {new Date(table.updatedAt).toLocaleString(locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2.5 max-[780px]:flex-col max-[780px]:items-start">
                  <span className="min-w-0 flex-1 break-words text-[13px] font-bold text-muted-foreground">{table.qrUrl}</span>
                  <Button
                    type="button"
                    className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                    onClick={() => void handleCopyQrUrl(table.qrUrl)}
                  >
                    {t(MessageKey.Copy)}
                  </Button>
                  <Button
                    type="button"
                    className="mt-0 min-h-9 bg-secondary text-secondary-foreground hover:bg-accent"
                    onClick={() => {
                      setFormError(null);
                      setSuccessMessage(null);
                      setEditingTable({ id: table.id, name: table.name, status: table.status });
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
