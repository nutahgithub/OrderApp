import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import type { Branch, RestaurantTable, TableStatus } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

type BranchesState =
  | { status: "loading" }
  | { status: "success"; branches: Branch[] }
  | { status: "error"; message: string };

type TablesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; tables: RestaurantTable[] }
  | { status: "error"; message: string };

type EditingTable = {
  id: string;
  name: string;
  status: TableStatus;
};

const tableStatusOptions: TableStatus[] = ["AVAILABLE", "OCCUPIED", "DISABLED"];

export const AdminTablesPage = () => {
  const { token, logout } = useAuth();
  const { locale, t } = useI18n();
  const [branchesState, setBranchesState] = useState<BranchesState>({ status: "loading" });
  const [tablesState, setTablesState] = useState<TablesState>({ status: "idle" });
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [newTableStatus, setNewTableStatus] = useState<TableStatus>("AVAILABLE");
  const [editingTable, setEditingTable] = useState<EditingTable | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const branches = branchesState.status === "success" ? branchesState.branches : [];
  const tables = tablesState.status === "success" ? tablesState.tables : [];

  const selectedBranch = useMemo(() => {
    return branches.find((branch) => branch.id === selectedBranchId) ?? null;
  }, [branches, selectedBranchId]);

  const loadBranches = useCallback(async () => {
    if (!token) {
      setBranchesState({ status: "error", message: t(MessageKey.AuthSessionExpired) });
      logout();
      return;
    }

    setBranchesState({ status: "loading" });

    try {
      const response = await apiClient.listBranches(token);
      setBranchesState({ status: "success", branches: response.branches });
      setSelectedBranchId((currentBranchId) => currentBranchId || response.branches[0]?.id || "");
    } catch (error: unknown) {
      setBranchesState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
    }
  }, [locale, logout, t, token]);

  const loadTables = useCallback(
    async (branchId: string) => {
      if (!token) {
        setTablesState({ status: "error", message: t(MessageKey.AuthSessionExpired) });
        logout();
        return;
      }

      if (!branchId) {
        setTablesState({ status: "idle" });
        return;
      }

      setTablesState({ status: "loading" });

      try {
        const response = await apiClient.listTables(token, branchId);
        setTablesState({ status: "success", tables: response.tables });
      } catch (error: unknown) {
        setTablesState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
      }
    },
    [locale, logout, t, token]
  );

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    void loadTables(selectedBranchId);
  }, [loadTables, selectedBranchId]);

  const resetForm = () => {
    setEditingTable(null);
    setNewTableName("");
    setNewTableStatus("AVAILABLE");
    setFormError(null);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      logout();
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await apiClient.createTable(token, {
        branchId: selectedBranchId,
        name: newTableName,
        status: newTableStatus
      });
      resetForm();
      await loadTables(selectedBranchId);
      setSuccessMessage(t(MessageKey.TablesCreated));
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !editingTable) {
      logout();
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await apiClient.updateTable(token, editingTable.id, {
        name: editingTable.name,
        status: editingTable.status
      });
      resetForm();
      await loadTables(selectedBranchId);
      setSuccessMessage(t(MessageKey.TablesUpdated));
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setIsSubmitting(false);
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

  const formStatus = editingTable ? editingTable.status : newTableStatus;
  const getTableStatusLabel = (status: TableStatus): string => {
    if (status === "AVAILABLE") {
      return t(MessageKey.Available);
    }

    if (status === "OCCUPIED") {
      return t(MessageKey.Occupied);
    }

    return t(MessageKey.Disabled);
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t(MessageKey.Setup)}</p>
          <h1>{t(MessageKey.TablesTitle)}</h1>
          <p className="page-subtitle">{t(MessageKey.TablesSubtitle)}</p>
        </div>
      </header>

      <section className="panel table-toolbar">
        <label className="field">
          {t(MessageKey.Branch)}
          <select
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
        <Button type="button" className="button--secondary button--inline" onClick={() => void loadBranches()}>
          {t(MessageKey.Refresh)}
        </Button>
      </section>

      {branchesState.status === "loading" ? <StateMessage title={t(MessageKey.TablesLoadingBranches)} /> : null}
      {branchesState.status === "error" ? (
        <StateMessage title={t(MessageKey.TablesUnableToLoadBranches)} description={branchesState.message} tone="error" />
      ) : null}
      {branchesState.status === "success" && branches.length === 0 ? (
        <StateMessage
          title={t(MessageKey.TablesNoBranchesTitle)}
          description={t(MessageKey.TablesNoBranchesDescription)}
        />
      ) : null}

      {selectedBranch ? (
        <section className="panel branch-form-panel">
          <h2>
            {editingTable
              ? t(MessageKey.TablesEditTitle)
              : t(MessageKey.TablesCreateTitle, { branchName: selectedBranch.name })}
          </h2>
          <p className="form-hint">{t(MessageKey.TablesHint)}</p>
          <form className="table-form" onSubmit={editingTable ? handleUpdate : handleCreate}>
            <Input
              label={t(MessageKey.TablesNameLabel)}
              name="tableName"
              placeholder={t(MessageKey.TablesNamePlaceholder)}
              value={editingTable ? editingTable.name : newTableName}
              onChange={(event) => {
                if (editingTable) {
                  setEditingTable({ ...editingTable, name: event.target.value });
                } else {
                  setNewTableName(event.target.value);
                }
              }}
              required
            />
            <label className="field">
              {t(MessageKey.Status)}
              <select
                value={formStatus}
                onChange={(event) => {
                  const nextStatus = event.target.value as TableStatus;

                  if (editingTable) {
                    setEditingTable({ ...editingTable, status: nextStatus });
                  } else {
                    setNewTableStatus(nextStatus);
                  }
                }}
              >
                {tableStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getTableStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <div className="branch-form-actions">
              {editingTable ? (
                <Button type="button" className="button--ghost" disabled={isSubmitting} onClick={resetForm}>
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

      <section className="panel">
        <div className="section-header">
          <div>
            <h2>{t(MessageKey.TablesListTitle)}</h2>
            {tables.length > 0 ? (
              <p className="section-subtitle">{t(MessageKey.TablesTotal, { count: tables.length })}</p>
            ) : null}
          </div>
          <Button
            type="button"
            className="button--secondary button--inline"
            disabled={!selectedBranchId}
            onClick={() => void loadTables(selectedBranchId)}
          >
            {t(MessageKey.Refresh)}
          </Button>
        </div>

        {copyMessage ? <StateMessage title={copyMessage} tone="success" /> : null}
        {tablesState.status === "idle" ? <StateMessage title={t(MessageKey.TablesSelectBranch)} /> : null}
        {tablesState.status === "loading" ? <StateMessage title={t(MessageKey.TablesLoading)} /> : null}
        {tablesState.status === "error" ? (
          <StateMessage title={t(MessageKey.TablesUnableToLoad)} description={tablesState.message} tone="error" />
        ) : null}
        {tablesState.status === "success" && tables.length === 0 ? (
          <StateMessage title={t(MessageKey.TablesEmptyTitle)} description={t(MessageKey.TablesEmptyDescription)} />
        ) : null}
        {tables.length > 0 ? (
          <div className="table-list">
            {tables.map((table) => (
              <article className="table-row" key={table.id}>
                <div className="table-row-main">
                  <strong>{table.name}</strong>
                  <span className={`status-pill status-pill--${table.status.toLowerCase()}`}>
                    {getTableStatusLabel(table.status)}
                  </span>
                  <span>
                    {t(MessageKey.Updated)} {new Date(table.updatedAt).toLocaleString(locale)}
                  </span>
                </div>
                <div className="qr-url">
                  <span>{table.qrUrl}</span>
                  <Button
                    type="button"
                    className="button--secondary button--inline"
                    onClick={() => void handleCopyQrUrl(table.qrUrl)}
                  >
                    {t(MessageKey.Copy)}
                  </Button>
                  <Button
                    type="button"
                    className="button--secondary button--inline"
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
