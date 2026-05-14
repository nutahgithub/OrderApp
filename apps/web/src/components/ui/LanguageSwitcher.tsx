import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

export const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="language-switcher">
      <span>{t(MessageKey.Language)}</span>
      <select value={locale} onChange={(event) => setLocale(event.target.value === "vi" ? "vi" : "en")}>
        <option value="en">{t(MessageKey.LanguageEnglish)}</option>
        <option value="vi">{t(MessageKey.LanguageVietnamese)}</option>
      </select>
    </label>
  );
};
