import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import type { Branch, RestaurantTable, TableStatus } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { MessageKey, t } from "../../lib/i18n/messages";

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
  const [branchesState, setBranchesState] = useState<BranchesState>({ status: "loading" });
  const [tablesState, setTablesState] = useState<TablesState>({ status: "idle" });
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [newTableStatus, setNewTableStatus] = useState<TableStatus>("AVAILABLE");
  const [editingTable, setEditingTable] = useState<EditingTable | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
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
      setBranchesState({ status: "error", message: getUserErrorMessage(error) });
    }
  }, [logout, token]);

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
        setTablesState({ status: "error", message: getUserErrorMessage(error) });
      }
    },
    [logout, token]
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
    setIsSubmitting(true);

    try {
      await apiClient.createTable(token, {
        branchId: selectedBranchId,
        name: newTableName,
        status: newTableStatus
      });
      resetForm();
      await loadTables(selectedBranchId);
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error));
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
    setIsSubmitting(true);

    try {
      await apiClient.updateTable(token, editingTable.id, {
        name: editingTable.name,
        status: editingTable.status
      });
      resetForm();
      await loadTables(selectedBranchId);
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyQrUrl = async (qrUrl: string) => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopyMessage("QR URL copied.");
    } catch {
      setCopyMessage("Copy is not available in this browser.");
    }
  };

  const formStatus = editingTable ? editingTable.status : newTableStatus;

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Setup</p>
          <h1>Tables</h1>
          <p className="page-subtitle">Manage tables by branch and copy customer QR links.</p>
        </div>
      </header>

      <section className="panel table-toolbar">
        <label className="field">
          Branch
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
          Refresh
        </Button>
      </section>

      {branchesState.status === "loading" ? <StateMessage title="Loading branches" /> : null}
      {branchesState.status === "error" ? (
        <StateMessage title="Unable to load branches" description={branchesState.message} tone="error" />
      ) : null}
      {branchesState.status === "success" && branches.length === 0 ? (
        <StateMessage title="No branches yet" description="Create a branch before adding tables." />
      ) : null}

      {selectedBranch ? (
        <section className="panel branch-form-panel">
          <h2>{editingTable ? "Edit table" : `Create table in ${selectedBranch.name}`}</h2>
          <form className="table-form" onSubmit={editingTable ? handleUpdate : handleCreate}>
            <Input
              label="Table name"
              name="tableName"
              placeholder="Table 1"
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
              Status
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
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <div className="branch-form-actions">
              {editingTable ? (
                <Button type="button" className="button--ghost" disabled={isSubmitting} onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" disabled={isSubmitting || !selectedBranchId}>
                {isSubmitting ? "Saving..." : editingTable ? "Save changes" : "Create table"}
              </Button>
            </div>
          </form>
          {formError ? <StateMessage title="Unable to save table" description={formError} tone="error" /> : null}
        </section>
      ) : null}

      <section className="panel">
        <div className="section-header">
          <h2>Table list</h2>
          <Button
            type="button"
            className="button--secondary button--inline"
            disabled={!selectedBranchId}
            onClick={() => void loadTables(selectedBranchId)}
          >
            Retry
          </Button>
        </div>

        {copyMessage ? <StateMessage title={copyMessage} tone="success" /> : null}
        {tablesState.status === "idle" ? <StateMessage title="Select a branch" /> : null}
        {tablesState.status === "loading" ? <StateMessage title="Loading tables" /> : null}
        {tablesState.status === "error" ? (
          <StateMessage title="Unable to load tables" description={tablesState.message} tone="error" />
        ) : null}
        {tablesState.status === "success" && tables.length === 0 ? (
          <StateMessage title="No tables yet" description="Create the first table for this branch." />
        ) : null}
        {tables.length > 0 ? (
          <div className="table-list">
            {tables.map((table) => (
              <article className="table-row" key={table.id}>
                <div className="table-row-main">
                  <strong>{table.name}</strong>
                  <span className={`status-pill status-pill--${table.status.toLowerCase()}`}>{table.status}</span>
                  <span>Updated {new Date(table.updatedAt).toLocaleString()}</span>
                </div>
                <div className="qr-url">
                  <span>{table.qrUrl}</span>
                  <Button
                    type="button"
                    className="button--secondary button--inline"
                    onClick={() => void handleCopyQrUrl(table.qrUrl)}
                  >
                    Copy
                  </Button>
                  <Button
                    type="button"
                    className="button--secondary button--inline"
                    onClick={() => setEditingTable({ id: table.id, name: table.name, status: table.status })}
                  >
                    Edit
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
