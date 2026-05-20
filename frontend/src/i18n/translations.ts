// EN + BG translations for ExpiryTracker
export const translations = {
  en: {
    appName: "Expiry Tracker",
    tabs: {
      home: "Home",
      categories: "Categories",
      settings: "Settings",
    },
    home: {
      title: "My Documents",
      subtitle: "Track everything that expires",
      emptyTitle: "No documents yet",
      emptyDescription:
        "Add your first document to start tracking expiration dates.",
      addButton: "Add Document",
      filterAll: "All",
      filterExpiringSoon: "Expiring soon",
      filterExpired: "Expired",
    },
    categories: {
      title: "Categories",
      subtitle: "Organize your items",
      emptyTitle: "No custom categories yet",
      emptyDescription: "Predefined and custom categories will appear here.",
      addButton: "Add Category",
      predefined: {
        documents: "Documents",
        insurance: "Insurance",
        warranties: "Warranties",
        other: "Other",
      },
    },
    settings: {
      title: "Settings",
      subtitle: "Preferences",
      language: "Language",
      languageEnglish: "English",
      languageBulgarian: "Български",
      notifications: "Notifications",
      haptics: "Haptic feedback",
      defaultReminders: "Default reminders",
      defaultRemindersHint: "Days before expiry to notify",
      about: "About",
      version: "Version",
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      comingSoon: "Coming soon",
    },
  },
  bg: {
    appName: "Изтичащи срокове",
    tabs: {
      home: "Начало",
      categories: "Категории",
      settings: "Настройки",
    },
    home: {
      title: "Моите документи",
      subtitle: "Следете всичко, което изтича",
      emptyTitle: "Още няма документи",
      emptyDescription:
        "Добавете първия си документ, за да започнете да следите сроковете.",
      addButton: "Добави документ",
      filterAll: "Всички",
      filterExpiringSoon: "Изтичат скоро",
      filterExpired: "Изтекли",
    },
    categories: {
      title: "Категории",
      subtitle: "Организирайте записите си",
      emptyTitle: "Още няма потребителски категории",
      emptyDescription:
        "Тук ще се показват предварителните и вашите категории.",
      addButton: "Добави категория",
      predefined: {
        documents: "Документи",
        insurance: "Застраховки",
        warranties: "Гаранции",
        other: "Други",
      },
    },
    settings: {
      title: "Настройки",
      subtitle: "Предпочитания",
      language: "Език",
      languageEnglish: "English",
      languageBulgarian: "Български",
      notifications: "Известия",
      haptics: "Тактилна обратна връзка",
      defaultReminders: "Стандартни напомняния",
      defaultRemindersHint: "Дни преди изтичане за известие",
      about: "За приложението",
      version: "Версия",
    },
    common: {
      save: "Запази",
      cancel: "Отказ",
      delete: "Изтрий",
      edit: "Редактирай",
      back: "Назад",
      comingSoon: "Очаквайте скоро",
    },
  },
};

export type Locale = "en" | "bg";
