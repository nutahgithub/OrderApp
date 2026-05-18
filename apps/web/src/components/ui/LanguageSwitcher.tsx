import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";

export const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="grid gap-1.5 text-[13px] font-bold text-inherit">
      <span>{t(MessageKey.Language)}</span>
      <select
        className="min-h-[38px] w-full rounded-md border border-input bg-card px-2.5 py-[7px] text-foreground"
        value={locale}
        onChange={(event) => setLocale(event.target.value === "vi" ? "vi" : "en")}
      >
        <option value="en">{t(MessageKey.LanguageEnglish)}</option>
        <option value="vi">{t(MessageKey.LanguageVietnamese)}</option>
      </select>
    </label>
  );
};
