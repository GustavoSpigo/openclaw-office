import { useTranslation } from "react-i18next";

const LANGUAGE_ORDER = ["zh", "en", "pt-BR"] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("layout");

  const currentLanguage = i18n.language?.startsWith("zh")
    ? "zh"
    : i18n.language?.startsWith("pt")
      ? "pt-BR"
      : "en";
  const currentIndex = LANGUAGE_ORDER.indexOf(currentLanguage);
  const nextLanguage = LANGUAGE_ORDER[(currentIndex + 1) % LANGUAGE_ORDER.length];

  const label = currentLanguage === "zh" ? "中文" : currentLanguage === "en" ? "EN" : "PT-BR";
  const ariaLabel =
    nextLanguage === "en"
      ? t("topbar.language.switchToEn")
      : nextLanguage === "zh"
        ? t("topbar.language.switchToZh")
        : t("topbar.language.switchToPtBr");

  const handleSwitch = () => {
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <button
      onClick={handleSwitch}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
    >
      {label}
    </button>
  );
}
