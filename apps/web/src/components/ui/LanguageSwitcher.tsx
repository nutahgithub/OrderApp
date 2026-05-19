import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { SelectField } from "./SelectField";

export const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useI18n();

  return (
    <SelectField
      className="text-inherit"
      label={t(MessageKey.Language)}
      options={[
        { label: t(MessageKey.LanguageEnglish), value: "en" },
        { label: t(MessageKey.LanguageVietnamese), value: "vi" }
      ]}
      value={locale}
      onValueChange={(value) => setLocale(value === "vi" ? "vi" : "en")}
    />
  );
};
