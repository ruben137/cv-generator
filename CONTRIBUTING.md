# Contributing to CV Simple

Thank you for helping improve a free and privacy-conscious CV generator.

## Before opening a pull request

1. Search existing issues and pull requests.
2. Open an issue before starting a large feature, dependency, template, storage mechanism, or architectural change.
3. Keep changes focused and avoid unrelated formatting rewrites.
4. Never include real CV data, personal photographs, credentials, analytics identifiers, or private information in fixtures and screenshots.

## Product principles

- Core functionality remains free and does not require registration.
- CV data and photographs stay on the user's device.
- Optional persistence is clearly described as browser-local storage.
- Spanish and English experiences remain equivalent.
- PDF and DOCX layouts should match the preview closely.
- Accessibility, mobile behavior, and one-page output are part of each feature.

Changes that transmit CV data externally, add accounts, introduce a paywall, or repurpose user information are outside the accepted scope unless the maintainer explicitly approves a new direction.

## Development

```bash
npm install
npm run dev
```

Before submitting:

```bash
npm run lint
npm run build
```

Pull requests should explain the user problem, include screenshots for visual changes, test Spanish and English, test desktop and mobile, and verify exports when changing CV rendering.

By contributing, you agree that your contribution is licensed under AGPL-3.0 and that project branding remains governed by [TRADEMARKS.md](TRADEMARKS.md).
