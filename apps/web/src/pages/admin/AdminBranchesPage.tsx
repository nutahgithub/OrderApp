import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import type { Branch } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { MessageKey, t } from "../../lib/i18n/messages";

type BranchesState =
  | { status: "loading" }
  | { status: "success"; branches: Branch[] }
  | { status: "error"; message: string };

type EditingBranch = {
  id: string;
  name: string;
};

export const AdminBranchesPage = () => {
  const { token, logout } = useAuth();
  const [branchesState, setBranchesState] = useState<BranchesState>({ status: "loading" });
  const [newBranchName, setNewBranchName] = useState("");
  const [editingBranch, setEditingBranch] = useState<EditingBranch | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (error: unknown) {
      setBranchesState({ status: "error", message: getUserErrorMessage(error) });
    }
  }, [logout, token]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      logout();
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await apiClient.createBranch(token, {
        name: newBranchName
      });
      setNewBranchName("");
      await loadBranches();
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !editingBranch) {
      logout();
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await apiClient.updateBranch(token, editingBranch.id, {
        name: editingBranch.name
      });
      setEditingBranch(null);
      await loadBranches();
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const branches = branchesState.status === "success" ? branchesState.branches : [];

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Setup</p>
          <h1>Branches</h1>
          <p className="page-subtitle">Manage restaurant branches for this tenant.</p>
        </div>
      </header>

      <section className="panel branch-form-panel">
        <h2>{editingBranch ? "Edit branch" : "Create branch"}</h2>
        <form className="branch-form" onSubmit={editingBranch ? handleUpdate : handleCreate}>
          <Input
            label="Branch name"
            name="branchName"
            placeholder="Main Branch"
            value={editingBranch ? editingBranch.name : newBranchName}
            onChange={(event) => {
              if (editingBranch) {
                setEditingBranch({ ...editingBranch, name: event.target.value });
              } else {
                setNewBranchName(event.target.value);
              }
            }}
            required
          />
          <div className="branch-form-actions">
            {editingBranch ? (
              <Button
                type="button"
                className="button--ghost"
                disabled={isSubmitting}
                onClick={() => setEditingBranch(null)}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingBranch ? "Save changes" : "Create branch"}
            </Button>
          </div>
        </form>
        {formError ? <StateMessage title="Unable to save branch" description={formError} tone="error" /> : null}
      </section>

      <section className="panel">
        <div className="section-header">
          <h2>Branch list</h2>
          <Button type="button" className="button--secondary button--inline" onClick={() => void loadBranches()}>
            Retry
          </Button>
        </div>

        {branchesState.status === "loading" ? <StateMessage title="Loading branches" /> : null}
        {branchesState.status === "error" ? (
          <StateMessage title="Unable to load branches" description={branchesState.message} tone="error" />
        ) : null}
        {branchesState.status === "success" && branches.length === 0 ? (
          <StateMessage title="No branches yet" description="Create the first branch to start setup." />
        ) : null}
        {branches.length > 0 ? (
          <div className="branch-list">
            {branches.map((branch) => (
              <article className="branch-row" key={branch.id}>
                <div>
                  <strong>{branch.name}</strong>
                  <span>Updated {new Date(branch.updatedAt).toLocaleString()}</span>
                </div>
                <Button
                  type="button"
                  className="button--secondary button--inline"
                  onClick={() => setEditingBranch({ id: branch.id, name: branch.name })}
                >
                  Edit
                </Button>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  );
};
