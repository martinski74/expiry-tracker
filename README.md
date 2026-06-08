
# 📄 Expiry Tracker

A beautiful, premium mobile app for tracking expiration dates of your important documents, insurance policies, warranties, and more. Never miss a renewal deadline again.

Built with **React Native** + **Expo SDK 54** • Supports **iOS** & **Android**

---

## ✨ Features

### 📋 Document Management
- Add, edit, and delete documents with expiry dates
- Attach photos of your documents (camera or gallery)
- Add optional notes and issue dates
- Search and filter documents by status

### 📁 Smart Categories
- **4 predefined categories**: Documents, Insurance, Warranties, Other
- Create **custom categories** with custom icons and colors
- Visual document count and urgency badges per category
- Safe delete with warning dialog — choose to keep or remove documents

### 🔔 Expiry Notifications
- Configurable reminders: 30 days, 14 days, 7 days, and 1 day before expiry
- Set default reminder preferences in Settings
- Push notifications to your device

### 🎨 Premium Design
- **Automatic Dark & Light mode** — follows your device system settings
- Warm earth-tone color palette
- Smooth animations powered by `react-native-reanimated`
- Glassmorphism tab bar with blur effect
- Haptic feedback for tactile interactions (configurable)

### 🌍 Multilingual
- **English** 🇬🇧
- **Bulgarian** 🇧🇬
- Easily switch language from Settings

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Database | SQLite (via `expo-sqlite`) |
| State | React hooks + Context |
| Animations | React Native Reanimated |
| Notifications | Expo Notifications |
| Fonts | Nunito (Google Fonts) |
| Icons | Ionicons (`@expo/vector-icons`) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) app on your phone (for quick testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/martinski74/expiry-tracker.git
   cd expiry-tracker
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open on your device**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator / `i` for iOS simulator

---

## 📂 Project Structure

```
expiry-tracker/
├── frontend/                   # React Native (Expo) app
│   ├── app/                    # Screens (file-based routing)
│   │   ├── (tabs)/             # Bottom tab screens
│   │   │   ├── index.tsx       #   → Home (document list)
│   │   │   ├── categories.tsx  #   → Categories overview
│   │   │   └── settings.tsx    #   → Settings & preferences
│   │   ├── document/
│   │   │   ├── new.tsx         #   → Add new document
│   │   │   └── [id].tsx        #   → Edit existing document
│   │   ├── category/
│   │   │   ├── new.tsx         #   → Add new category
│   │   │   └── view/[id].tsx   #   → Category detail view
│   │   └── _layout.tsx         # Root layout (providers)
│   │
│   ├── src/                    # Shared modules
│   │   ├── components/         # Reusable UI components
│   │   ├── db/                 # SQLite database layer
│   │   │   ├── database.ts     #   → Schema, migrations, seeding
│   │   │   ├── documents.ts    #   → Document CRUD operations
│   │   │   └── categories.ts   #   → Category CRUD operations
│   │   ├── i18n/               # Internationalization (EN/BG)
│   │   ├── theme/              # Colors, fonts, spacing tokens
│   │   ├── notifications/      # Push notification scheduling
│   │   ├── hooks/              # Custom React hooks
│   │   ├── preferences/        # User preferences (haptics, etc.)
│   │   └── utils/              # Helpers (urgency, haptics, dates)
│   │
│   ├── assets/                 # Images, icons, splash screen
│   ├── app.json                # Expo configuration
│   └── package.json            # Dependencies
│
├── design_guidelines.json      # Design system reference
└── README.md                   # ← You are here
```

---

## 📱 App Screens

<p align="center">
<img width="22%" alt="Home Screen" src="https://github.com/user-attachments/assets/a79d221e-084e-48aa-b688-bc69c9a1654a" />
<img width="22%" alt="Categories Screen" src="https://github.com/user-attachments/assets/fc61bcf8-3347-4356-8497-a1a833210877" />
<img  width="22%" alt="Settings Screen" src="https://github.com/user-attachments/assets/9395a3da-abd2-4bad-86c6-1c6c297fca7f" />
<img width="22%" alt="App Icon" src="https://github.com/user-attachments/assets/b9a2f193-68d9-4256-8473-d5da68ddb47f" />
</p>

| Screen | Description |
|---|---|
| **Home** | View all documents sorted by urgency. Search, filter by status (All / Expiring Soon / Expired). Pull to refresh. |
| **Categories** | Browse predefined and custom categories. See document counts and urgency badges. Long-press to delete custom categories. |
| **Settings** | Switch language, toggle haptic feedback, set default reminder intervals, view stats. |
| **Add/Edit Document** | Form with title, category picker, date picker, photo upload, notes, and reminder configuration. |
| **Category View** | View all documents within a specific category. Edit documents directly from here. |

---

## ⚙️ Configuration

### Database
The app uses a local **SQLite** database stored on-device. No server or internet connection required — your data stays private on your phone.

The database is automatically created and seeded with 4 predefined categories on first launch.

### Notifications
Push notifications require explicit user permission. The app will prompt you when you first save a document with reminders enabled.

### Theme
The app automatically detects your device's system theme (Light/Dark) and adjusts all colors accordingly. There is no manual toggle — it follows your phone settings.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private. All rights reserved.

---

## 🙏 Acknowledgements

- [Expo](https://expo.dev) — For the incredible React Native toolchain
- [Ionicons](https://ionic.io/ionicons) — Beautiful open-source icons
- [Nunito Font](https://fonts.google.com/specimen/Nunito) — Warm, friendly typography

---

<p align="center">
  <em>Made for tracking what matters ❤️</em>
</p>
