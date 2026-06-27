---
name: dest-app-project
description: DestinationFareways flight route posting app — Expo Router, Redux, light theme, screens in src/screens/
metadata:
  type: project
---

Flight route posting app for editors to manage and publish flight routes.

**Why:** Internal tool for adding/managing destination flight route pages with SEO fields, images, wallet earning system.

**How to apply:** When making changes, follow the established screen/routing pattern. All screen logic lives in `src/screens/`, `app/` files are thin wrappers.

## Architecture
- **Framework:** Expo Router (file-based routing), React Native
- **State:** Redux Toolkit + AsyncStorage (persists auth)
- **Theme:** Light/white minimal — `constants/theme.ts`, `colors`, `authColors`, `shadow`, `radius`, `spacing`
- **Auth API:** `https://destinationfareways.com/api/auth/login?email=...&password=...` (GET, returns `{success, token, user}`)
- **Wallet:** ₹5 per post earned (mock data, no API)

## Screen/Route Map
- `app/(auth)/` → `src/screens/auth/` (Login, Signup, OTP, ForgotPassword, ResetPassword)
- `app/(tabs)/index` → `src/screens/HomeScreen` (analytics dashboard)
- `app/(tabs)/posts` → `src/screens/PostsScreen` (list with search/filter)
- `app/(tabs)/wallet` → `src/screens/WalletScreen` (balance, transactions, withdrawal modal)
- `app/(tabs)/profile` → `src/screens/ProfileScreen` (avatar, wallet overview, menu)
- `app/add-post` → `src/screens/AddPostScreen` (full 7-section form with image pickers)
- `app/edit-post/[id]` → `src/screens/EditPostScreen` (view/toggle/delete post)

## Auth screens
- Dark background (#111827) + white card floating bottom (rounded top corners, 32px radius)
- Login has Login/Register pill tab switcher

## Main app theme
- Background `#F5F7FA`, cards `#FFFFFF`, accent `#00C4A8` (teal — the original, restored)
- Bottom tab bar: floating white card with rounded corners, center `+` button elevated (teal circle)

## Key packages
- `expo-image-picker` (added, need `npm install` if not yet)
- `lucide-react-native` for all icons
- `react-redux` + `@reduxjs/toolkit` + `@react-native-async-storage/async-storage`
