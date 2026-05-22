# Expiry Tracker — Product Requirements Document

## Overview
A mobile app (iOS + Android) to track expiration dates of personal documents, guarantees, insurances and other items. All data is stored locally on the device — no backend, no account.

## Tech Stack
- **Framework**: React Native + Expo (SDK 54)
- **Navigation**: Expo Router (file-based)
- **Local DB**: expo-sqlite *(Step 2)*
- **Notifications**: expo-notifications *(Step 8)*
- **Images**: expo-image-picker *(Step 7)*
- **i18n**: i18n-js + expo-localization (EN + BG)
- **Theme**: Warm earth-tones (terracotta, sand, cream)

## Features (build order)
| Step | Feature | Status |
|---|---|---|
| 1 | Foundation: tabs, i18n (EN/BG), theme, placeholder screens | ✅ Done |
| 2 | SQLite DB + seed predefined categories | ✅ Done |
| 3 | Home: list documents with status badges | ✅ Done |
| 4 | Add document form (title, category, date, notes) | ✅ Done |
| 5 | Edit / Delete document | ⏳ |
| 6 | Custom categories | ⏳ |
| 7 | Photo attachments | ⏳ |
| 8 | Local notifications (reminders) | ⏳ |
| 9 | Settings polish (default reminder days) | ⏳ |
| 10 | Final UX polish | ⏳ |

## Data Model (planned)
- `documents`: id, title, category_id, expiry_date, issue_date, notes, image_uri, notify_days_before, created_at, updated_at
- `categories`: id, name, icon, color, is_predefined

## Bilingual Support
- Auto-detects device language on first launch (EN or BG)
- Manual toggle in Settings, persisted in AsyncStorage
- Uses Nunito font for proper Cyrillic rendering
