# innozverse Mobile App

Flutter mobile application for iOS and Android.

## Getting Started

### Prerequisites

- Flutter SDK (3.10.4 or higher)
- Xcode (for iOS development)
- Android Studio (for Android development)

### Install Dependencies

```bash
flutter pub get
```

## Running the App

### With Default Local API (http://localhost:8080)

**iOS Simulator:**
```bash
flutter run -d ios
```

**Android Emulator:**
```bash
flutter run -d android
```

### With Custom API Base URL

Use `--dart-define` to specify a custom API base URL:

**iOS Simulator:**
```bash
flutter run -d ios --dart-define=API_BASE_URL=http://10.0.2.2:8080
```

**Android Emulator:**
```bash
# For Android emulator, use 10.0.2.2 to access host machine's localhost
flutter run -d android --dart-define=API_BASE_URL=http://10.0.2.2:8080
```

**Production API:**
```bash
flutter run --dart-define=API_BASE_URL=https://innozverse-api.fly.dev
```

### Note on Android Emulator Networking

- Android emulator cannot access `localhost` or `127.0.0.1` directly
- Use `10.0.2.2` to access your host machine's `localhost`
- Example: `http://10.0.2.2:8080` maps to `http://localhost:8080` on your host

### Note on iOS Simulator Networking

- iOS simulator can access `localhost` directly when running on the same machine
- Use the actual IP address when testing on physical devices

## Building for Production

**iOS:**
```bash
flutter build ios --dart-define=API_BASE_URL=https://innozverse-api.fly.dev
```

**Android:**
```bash
flutter build apk --dart-define=API_BASE_URL=https://innozverse-api.fly.dev
```

## Project Structure

```
lib/
├── main.dart              # App entry point and UI
└── services/
    └── api_service.dart   # API client and health check
```

## Configuration

The app uses `--dart-define` for environment configuration:

- `API_BASE_URL`: Base URL for the API (default: `http://localhost:8080`)

## Features

- Health check button to test API connectivity
- Displays API status, version, and timestamp
- Error handling and loading states
