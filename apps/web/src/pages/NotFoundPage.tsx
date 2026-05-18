import { Link } from "react-router-dom";
import { StateMessage } from "../components/ui/StateMessage";
import { useI18n } from "../lib/i18n/I18nContext";
import { MessageKey } from "../lib/i18n/messages";

export const NotFoundPage = () => {
  const { t } = useI18n();

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <StateMessage title={t(MessageKey.NotFoundTitle)} description={t(MessageKey.NotFoundDescription)} />
      <Link to="/admin/dashboard">{t(MessageKey.NotFoundGoDashboard)}</Link>
    </main>
  );
};
