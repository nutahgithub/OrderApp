import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { StateMessage } from "../../components/ui/StateMessage";
import { apiClient } from "../../lib/api/client";
import type { Menu, QrEntry } from "../../lib/api/types";
import { getUserErrorMessage } from "../../lib/i18n/error-messages";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

type QrRouteParams = {
  tenantId: string;
  branchId: string;
  tableId: string;
};

export const CustomerQrEntryPage = () => {
  const { locale, t } = useI18n();
  const { tenantId, branchId, tableId } = useParams<QrRouteParams>();
  const [qrEntryState, setQrEntryState] = useState<
    | { status: "loading" }
    | { status: "success"; qrEntry: QrEntry }
    | { status: "error"; message: string }
  >({ status: "loading" });
  const [menusState, setMenusState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; menus: Menu[] }
    | { status: "error"; message: string }
  >({ status: "idle" });

  useEffect(() => {
    if (!tenantId || !branchId || !tableId) {
      setQrEntryState({
        status: "error",
        message: t(MessageKey.QrMissingData)
      });
      return;
    }

    let isMounted = true;

    const loadQrEntry = async () => {
      setQrEntryState({ status: "loading" });

      try {
        const response = await apiClient.getQrEntry(tenantId, branchId, tableId);

        if (isMounted) {
          setQrEntryState({ status: "success", qrEntry: response.qrEntry });
        }
      } catch (error: unknown) {
        if (isMounted) {
          setQrEntryState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
        }
      }
    };

    void loadQrEntry();

    return () => {
      isMounted = false;
    };
  }, [branchId, locale, t, tableId, tenantId]);

  useEffect(() => {
    if (!tenantId || !branchId || !tableId || qrEntryState.status !== "success") {
      setMenusState({ status: "idle" });
      return;
    }

    if (qrEntryState.qrEntry.table.status === "DISABLED") {
      setMenusState({ status: "idle" });
      return;
    }

    let isMounted = true;

    const loadMenus = async () => {
      setMenusState({ status: "loading" });

      try {
        const response = await apiClient.listPublicMenus(tenantId, branchId, tableId);

        if (isMounted) {
          setMenusState({ status: "success", menus: response.menus });
        }
      } catch (error: unknown) {
        if (isMounted) {
          setMenusState({ status: "error", message: getUserErrorMessage(error, MessageKey.RequestFailed, locale) });
        }
      }
    };

    void loadMenus();

    return () => {
      isMounted = false;
    };
  }, [branchId, locale, qrEntryState, t, tableId, tenantId]);

  if (!tenantId || !branchId || !tableId) {
    return <StateMessage title={t(MessageKey.QrInvalidTitle)} description={t(MessageKey.QrMissingData)} tone="error" />;
  }

  if (qrEntryState.status === "loading") {
    return <StateMessage title={t(MessageKey.QrCheckingTable)} description={t(MessageKey.QrCheckingTableDescription)} />;
  }

  if (qrEntryState.status === "error") {
    return <StateMessage title={t(MessageKey.QrInvalidTitle)} description={qrEntryState.message} tone="error" />;
  }

  const { qrEntry } = qrEntryState;
  const isDisabled = qrEntry.table.status === "DISABLED";
  const menus = menusState.status === "success" ? menusState.menus : [];
  const formatCurrency = (price: string): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 2
    }).format(Number(price));
  };

  return (
    <section className="customer-card">
      <p className="eyebrow">{t(MessageKey.QrEyebrow)}</p>
      <h1>{qrEntry.table.name}</h1>
      <p className="customer-subtitle">{qrEntry.branch.name}</p>
      <dl className="qr-context">
        <div>
          <dt>{t(MessageKey.QrBranch)}</dt>
          <dd>{qrEntry.branch.name}</dd>
        </div>
        <div>
          <dt>{t(MessageKey.QrTableStatus)}</dt>
          <dd>
            {qrEntry.table.status === "DISABLED" ? t(MessageKey.Unavailable) : t(MessageKey.ReadyToOrder)}
          </dd>
        </div>
      </dl>
      {isDisabled ? (
        <StateMessage
          title={t(MessageKey.QrTableUnavailableTitle)}
          description={t(MessageKey.QrTableUnavailableDescription)}
          tone="error"
        />
      ) : null}

      {!isDisabled && menusState.status === "loading" ? (
        <StateMessage title={t(MessageKey.QrLoadingMenuTitle)} description={t(MessageKey.QrLoadingMenuDescription)} />
      ) : null}
      {!isDisabled && menusState.status === "error" ? (
        <StateMessage title={t(MessageKey.QrUnableToLoadMenu)} description={menusState.message} tone="error" />
      ) : null}
      {!isDisabled && menusState.status === "success" && menus.length === 0 ? (
        <StateMessage title={t(MessageKey.QrNoDishesTitle)} description={t(MessageKey.QrNoDishesDescription)} />
      ) : null}
      {!isDisabled && menus.length > 0 ? (
        <>
          <div className="customer-section-header">
            <h2>{t(MessageKey.QrAvailableDishes)}</h2>
            <span>{t(MessageKey.QrItems, { count: menus.length })}</span>
          </div>
          <div className="customer-menu-list">
            {menus.map((menu) => (
              <article className="customer-menu-row" key={menu.id}>
                <div className="customer-menu-thumb" aria-label={menu.imageUrl ? menu.name : t(MessageKey.MenusNoImage)}>
                  {menu.imageUrl ? <img src={menu.imageUrl} alt={menu.name} loading="lazy" /> : <span>{menu.name[0]}</span>}
                </div>
                <div>
                  <strong>{menu.name}</strong>
                  <span>{t(MessageKey.QrAvailableNow)}</span>
                </div>
                <b>{formatCurrency(menu.price)}</b>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
};
