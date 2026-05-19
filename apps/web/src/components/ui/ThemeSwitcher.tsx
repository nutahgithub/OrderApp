import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { themeOptions, useTheme } from "../../lib/theme/ThemeContext";
import { SelectField } from "./SelectField";

const themeLabelKeyByName = {
  fresh: MessageKey.ThemeFresh,
  classic: MessageKey.ThemeClassic,
  "high-contrast": MessageKey.ThemeHighContrast
} as const;

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <SelectField
      className="text-inherit"
      label={t(MessageKey.ThemeLabel)}
      options={themeOptions.map((option) => ({
        label: t(themeLabelKeyByName[option]),
        value: option
      }))}
      value={theme}
      onValueChange={(value) => setTheme(value as typeof theme)}
    />
  );
};
