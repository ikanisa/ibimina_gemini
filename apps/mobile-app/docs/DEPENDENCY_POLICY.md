# Dependency Policy

## Supported Categories
We encourage using dependencies that fall into these categories:
- **Core Flutter/Dart Team**: `flutter_lints`, `flutter_riverpod`, `go_router`, `intl`, `path`, `image_picker`.
- **Verified Official SDKs**: `supabase_flutter`, `sentry_flutter`.
- **Standard Community Packages**: `mobile_scanner`, `qr_flutter`, `app_links`, `flutter_secure_storage`, `local_auth`.
- **Utilities**: `crypto`, `package_info_plus`.

## Review Rules for New Dependencies
Before adding a new package, justify:
1. **Necessity**: Can this be done with existing deps or standard library?
2. **Quality**: Is it maintained? Has it been updated recently? 
3. **Size**: Does it add significant bloat to the app bundle?
4. **License**: Is the license compatible (MIT/BSD/Apache)?

## Code Generation
- Avoid code generation unless necessary for type safety (e.g. `json_serializable`, `freezed`) or to reduce boilerplate significantly.
- If adding code generation, ensure `build_runner` is added to `dev_dependencies`.

## Audit Code 
- CI runs `flutter pub outdated`. Check this log periodically to identify stale packages.
