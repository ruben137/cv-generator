# CV Simple

[![CI](https://github.com/ruben137/cv-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/ruben137/cv-generator/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)

Create a clear, professional one-page CV without registration, paywalls, or uploading your personal information to a server.

> Crea un CV profesional de una página sin registro, paywalls ni enviar tu información personal a un servidor.

![CV Simple — free and private CV generator](public/og.png)

## Why CV Simple?

Many CV builders let people complete the entire form before revealing that downloading requires payment. CV Simple takes a different approach: every editor feature and every export format is available for free from the beginning.

- No account or registration.
- No artificial premium limits.
- PDF and DOCX exports generated in the browser.
- Multiple CVs saved locally in the browser.
- Spanish and English interface.
- Reorderable sections and list items.
- Custom sections, colors, typography, photo styles, and templates.
- CV data and photos are not sent to an application server.

CV Simple uses browser storage only when the user enables or uses local saving. Clearing browser data can remove locally saved CVs.

## ¿Por qué CV Simple?

Muchos generadores permiten completar todo el formulario antes de informar que la descarga es de pago. CV Simple ofrece desde el principio todas las funciones del editor y los formatos de exportación gratuitamente.

Los CV se procesan en el navegador. La aplicación no necesita una cuenta ni envía el contenido del CV o la fotografía a un servidor propio. El guardado local depende del almacenamiento del navegador.

## Tech stack

- [Next.js](https://nextjs.org/) and React
- [Material UI](https://mui.com/)
- [React Hook Form](https://react-hook-form.com/)
- [dnd kit](https://dndkit.com/)
- [next-intl](https://next-intl.dev/)
- [pdf-lib](https://pdf-lib.js.org/) and [docx](https://docx.js.org/)
- TypeScript

## Run locally

Requirements: Node.js 22 and npm.

```bash
git clone https://github.com/ruben137/cv-generator.git
cd cv-generator
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production SEO configuration

Copy `.env.example` to `.env.local` for local overrides and configure these variables in the deployment platform:

```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
GOOGLE_SITE_VERIFICATION=
BING_SITE_VERIFICATION=
```

`NEXT_PUBLIC_SITE_URL` defines canonical URLs, the sitemap host, structured data, and social metadata. Vercel's production URL is used automatically when this variable is absent, but an explicit custom domain is recommended. The verification tokens are optional and must contain only the token supplied by each webmaster platform, not a complete HTML tag.

## Available commands

```bash
npm run dev      # Development server
npm run lint     # ESLint checks
npm run build    # Production build
npm test         # Build and rendered HTML tests
```

## Privacy architecture

- Form state is handled in the browser.
- PDF and DOCX generation runs on the client.
- Optional autosave and “My CVs” use browser-local storage.
- No CV content, contact details, or photographs should be added to analytics or application logs.

When contributing, do not introduce external transmission of CV data without an explicit product decision, clear disclosure, and a privacy review.

## Contributing

Issues and focused pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before starting. Security reports must follow [SECURITY.md](SECURITY.md) and should not be posted publicly.

## License and brand

The source code is licensed under the [GNU Affero General Public License v3.0](LICENSE).

“CV Simple”, its logo, visual identity, and related brand assets are not licensed under the AGPL. Forks and derivative deployments must use a different name and identity. See [TRADEMARKS.md](TRADEMARKS.md).

Copyright © 2026 CV Simple contributors.
