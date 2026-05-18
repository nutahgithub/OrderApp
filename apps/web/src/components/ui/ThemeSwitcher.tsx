import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { themeOptions, useTheme } from "../../lib/theme/ThemeContext";

const themeLabelKeyByName = {
  fresh: MessageKey.ThemeFresh,
  classic: MessageKey.ThemeClassic,
  "high-contrast": MessageKey.ThemeHighContrast
} as const;

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <label className="grid gap-1.5 text-[13px] font-bold text-inherit">
      <span>{t(MessageKey.ThemeLabel)}</span>
      <select
        className="min-h-[38px] w-full rounded-md border border-input bg-card px-2.5 py-[7px] text-foreground"
        value={theme}
        onChange={(event) => setTheme(event.target.value as typeof theme)}
      >
        {themeOptions.map((option) => (
          <option key={option} value={option}>
            {t(themeLabelKeyByName[option])}
          </option>
        ))}
      </select>
    </label>
  );
};
