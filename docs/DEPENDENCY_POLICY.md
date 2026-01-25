# Dependency Policy

This document outlines the policy for adding, updating, and removing dependencies in the Ibimina project.

## 1. Principles
- **Minimalism**: Only add dependencies when absolutely necessary.
- **Maintenance**: Prefer well-maintained packages with recent activity and good community support.
- **License**: Only use packages with compatible open-source licenses (MIT, Apache 2.0, BSD).
- **Size**: Be mindful of the bundle size impact of new packages.

## 2. Adding New Dependencies
Before adding a new dependency, consider:
- Can this be implemented easily with existing code or packages?
- Is the package actively maintained?
- Does it have good test coverage?

## 3. Review Process
All new dependencies must be reviewed as part of the PR process.
- Explain *why* the package is needed.
- Confirm it works with the current Flutter/Dart versions.
- Check for conflicts with existing dependencies.

## 4. Updates
- Run `flutter pub outdated` regularly to check for updates.
- Update dependencies with caution, testing for regressions.
- Major version updates require a dedicated PR and thorough testing.

## 5. Vulnerability Scanning
- We aim to keep dependencies free of known vulnerabilities.
- Run `flutter pub outdated` to check for security advisories (when supported).

## 6. Prohibited Packages
- Packages that introduce analytics or tracking without explicit consent.
- Packages with obscure or restrictive licenses (e.g., GPL for proprietary parts).
- Abandoned packages (no updates in > 1 year).
