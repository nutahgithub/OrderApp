import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StateMessage } from "../../components/ui/StateMessage";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import type { Branch } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

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
  const { locale, t } = useI18n();
  const [branchesState, setBranchesState] = useState<BranchesState>({ status: "loading" });
  const [newBranchName, setNewBranchName] = useState("");
  const [editingBranch, setEditingBranch] = useState<EditingBranch | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
      setBranchesState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
    }
  }, [locale, logout, t, token]);

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
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await apiClient.createBranch(token, {
        name: newBranchName
      });
      setNewBranchName("");
      await loadBranches();
      setSuccessMessage(t(MessageKey.BranchesCreated));
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
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
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await apiClient.updateBranch(token, editingBranch.id, {
        name: editingBranch.name
      });
      setEditingBranch(null);
      await loadBranches();
      setSuccessMessage(t(MessageKey.BranchesUpdated));
    } catch (error: unknown) {
      setFormError(getUserErrorMessage(error, MessageKey.RequestFailed, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const branches = branchesState.status === "success" ? branchesState.branches : [];

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t(MessageKey.Setup)}</p>
          <h1>{t(MessageKey.BranchesTitle)}</h1>
          <p className="page-subtitle">{t(MessageKey.BranchesSubtitle)}</p>
        </div>
      </header>

      <section className="panel branch-form-panel">
        <h2>{editingBranch ? t(MessageKey.BranchesEditTitle) : t(MessageKey.BranchesCreateTitle)}</h2>
        <p className="form-hint">{t(MessageKey.BranchesHint)}</p>
        <form className="branch-form" onSubmit={editingBranch ? handleUpdate : handleCreate}>
          <Input
            label={t(MessageKey.BranchesNameLabel)}
            name="branchName"
            placeholder={t(MessageKey.BranchesNamePlaceholder)}
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
                onClick={() => {
                  setEditingBranch(null);
                  setFormError(null);
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
        {successMessage ? <StateMessage title={successMessage} tone="success" /> : null}
        {formError ? (
          <StateMessage title={t(MessageKey.BranchesUnableToSave)} description={formError} tone="error" />
        ) : null}
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h2>{t(MessageKey.BranchesListTitle)}</h2>
            {branches.length > 0 ? (
              <p className="section-subtitle">{t(MessageKey.BranchesTotal, { count: branches.length })}</p>
            ) : null}
          </div>
          <Button type="button" className="button--secondary button--inline" onClick={() => void loadBranches()}>
            {t(MessageKey.Refresh)}
          </Button>
        </div>

        {branchesState.status === "loading" ? <StateMessage title={t(MessageKey.BranchesLoading)} /> : null}
        {branchesState.status === "error" ? (
          <StateMessage title={t(MessageKey.BranchesUnableToLoad)} description={branchesState.message} tone="error" />
        ) : null}
        {branchesState.status === "success" && branches.length === 0 ? (
          <StateMessage title={t(MessageKey.BranchesEmptyTitle)} description={t(MessageKey.BranchesEmptyDescription)} />
        ) : null}
        {branches.length > 0 ? (
          <div className="branch-list">
            {branches.map((branch) => (
              <article className="branch-row" key={branch.id}>
                <div>
                  <strong>{branch.name}</strong>
                  <span>
                    {t(MessageKey.Updated)} {new Date(branch.updatedAt).toLocaleString(locale)}
                  </span>
                </div>
                <Button
                  type="button"
                  className="button--secondary button--inline"
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
