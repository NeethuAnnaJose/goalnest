# GoalNest Mobile

Flutter mobile app for GoalNest — connected to the NestJS backend API.

## Features

- Login / Register / MFA verification
- Dashboard with financial health score, charts, goals, EMIs
- Expenses — list, add
- Savings — accounts, growth stats
- Goals — create, track progress
- Loans — create, upcoming EMIs
- Notifications — list, mark read
- Reports — generate, view history

## Tech Stack

- Flutter 3.2+
- **Riverpod** for state management
- **Dio** for HTTP + JWT refresh
- **flutter_secure_storage** for token storage
- **fl_chart** for dashboard charts
- **google_fonts** for typography

## API Connection

Base URL is configured in `lib/core/constants/api_constants.dart`:

| Environment | URL |
|-------------|-----|
| Android Emulator | `http://10.0.2.2:3001/api/v1` (default) |
| iOS Simulator | `http://localhost:3001/api/v1` |
| Physical Device | `http://<YOUR_LAN_IP>:3001/api/v1` |

Override at build time:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.100:3001/api/v1
```

## Setup

1. Install [Flutter SDK](https://docs.flutter.dev/get-started/install)
2. Start the backend: `cd ../backend && npm run start:dev`
3. Install dependencies:

```bash
cd mobile
flutter pub get
```

4. Run on emulator/device:

```bash
flutter run
```

## Project Structure

```
lib/
├── core/           # API client, theme, utils
├── features/       # Feature modules (auth, dashboard, etc.)
├── shared/         # Shared widgets and home shell
├── app.dart
└── main.dart
```

## Backend Endpoints Used

- `POST /auth/login`, `/register`, `/mfa/verify`, `/refresh`
- `GET /users/me`, `/dashboard`, `/health-score`
- `GET/POST /expenses`, `/savings`, `/goals`, `/loans`
- `GET /notifications`, `/reports`
- `POST /reports/generate`
