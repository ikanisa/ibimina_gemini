# Build Commands

## Prerequisites
- Flutter SDK 3.10+
- Android Studio / Xcode configured
- `key.properties` file configured (not committed)

## 1. Development (Debug)
Run on connected device/emulator:
```bash
flutter run
```

## 2. Staging Build (APK)
Build a profilable APK for testing performance:
```bash
flutter build apk --profile
```

## 3. Production Release (Android App Bundle)
Build the final bundle for Play Store:
```bash
flutter build appbundle --release --obfuscate --split-debug-info=./debug-info
```

## 4. Production Release (iOS IPA)
Build the archive:
```bash
flutter build ipa --release
```

## Troubleshooting
- **Clean**: `flutter clean && flutter pub get`
- **Pod Issues**: `cd ios && pod install --repo-update`
