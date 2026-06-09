# Ali Koroglu Portfolio & CMS

A modern personal portfolio and admin-managed CMS built with Next.js 16, TypeScript, PostgreSQL, Prisma, and Vercel. This project is designed as a production-grade portfolio system: the public website is backed by editable CMS content, while the admin panel manages portfolio data, media, messages, security controls, and site settings.

The project demonstrates full-stack development, database design, authentication, security, CMS architecture, and a deployment workflow suitable for a real personal brand website.

## Live Demo / Links

- Live Demo: https://your-domain.com
- GitHub: https://github.com/alikorogluts
- LinkedIn: https://linkedin.com/in/alikorogluts

## Preview

Screenshots are expected in `docs/screenshots/`. Placeholder references are included until real screenshots are added.

| Public Portfolio | Admin Dashboard |
| --- | --- |
| ![Public Portfolio](docs/screenshots/public-portfolio.png) | ![Admin Dashboard](docs/screenshots/admin-dashboard.png) |

| Media Library | Security Page |
| --- | --- |
| ![Media Library](docs/screenshots/media-library.png) | ![Security Page](docs/screenshots/security-page.png) |

## Key Features

### Public Website

- Dynamic portfolio content loaded from PostgreSQL through a data access layer
- Hero section with editable headline, animated words, CTAs, and visual assets
- Projects section
- Experience section
- Skills section
- Highlights section
- Contact form with message persistence
- Maintenance mode
- OpenGraph/social sharing image support
- Analytics settings support
- Responsive design

### Admin Panel

- Dashboard
- Profile management
- Hero management
- Project CRUD
- Experience CRUD
- Skills CRUD
- Highlights CRUD
- Messages/contact management
- Site settings
- Media Library
- Audit logs
- Security settings

### Security

- Admin authentication
- HttpOnly cookie sessions
- Password hashing with bcrypt
- Two-Factor Authentication with TOTP
- Backup codes
- Session revocation
- Logout from all devices
- Password change
- Email change
- Audit logging
- Protected admin routes

### Media Library

- Image upload
- PDF upload
- Local media storage under `public/uploads`
- Media picker
- URL auto-fill for CMS fields

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

### Backend

- Next.js App Router
- Server Actions
- Route Handlers

### Database

- PostgreSQL
- Prisma ORM

### Auth & Security

- JWT
- HttpOnly cookies
- bcrypt
- TOTP 2FA

### Deployment

- Vercel

## System Architecture

```text
Browser
  v
Next.js App Router
  v
Server Actions / API Routes
  v
Prisma ORM
  v
PostgreSQL
```

Public portfolio content is read from the database through `lib/portfolio-data.ts`. If database content is missing or temporarily unavailable, the public website falls back to static data from `components/landing/portfolio-data.ts`, keeping the portfolio renderable while CMS data is incomplete.

## Database Models

Important Prisma models include:

- `AdminUser`
- `AdminSession`
- `AdminLoginLog`
- `AdminAuditLog`
- `AdminBackupCode`
- `AdminMediaAsset`
- `PortfolioProfile`
- `PortfolioHero`
- `PortfolioProject`
- `PortfolioExperience`
- `PortfolioSkillGroup`
- `PortfolioHighlight`
- `SiteSettings`
- `ContactMessage`

## Admin Routes

- `/admin`
- `/admin/login`
- `/admin/profile`
- `/admin/hero`
- `/admin/projects`
- `/admin/experience`
- `/admin/skills`
- `/admin/highlights`
- `/admin/messages`
- `/admin/media`
- `/admin/security`
- `/admin/audit-logs`
- `/admin/settings`

## Repository Structure

```text
app/
  admin/                Admin dashboard, CMS pages, security pages, and actions
  api/                  Contact, authentication, 2FA, and media upload route handlers
  page.tsx              Public portfolio entry point
components/
  landing/              Public portfolio sections and fallback content
  ui/                   Shared UI primitives
lib/
  auth.ts               Admin authentication and session helpers
  portfolio-data.ts     Public portfolio data access and fallback logic
  prisma.ts             Prisma client utilities
  two-factor.ts         TOTP and backup code helpers
prisma/
  schema.prisma         Database schema
  migrations/           Prisma migrations
  seed.ts               Seed script for portfolio CMS content
public/
  uploads/              Local uploaded media files
docs/
  screenshots/          Screenshot placeholders for README previews
```

## Environment Variables

Create a local `.env` file from `.env.example` and set the required values. Do not commit real secrets.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
TWO_FACTOR_ENCRYPTION_KEY="replace-with-32-byte-base64-key"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
NEXT_PUBLIC_UMAMI_SCRIPT_URL="https://analytics.example.com/script.js"
```

`NEXT_PUBLIC_UMAMI_SCRIPT_URL` is optional and should only be set when Umami analytics is used.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Generate Prisma Client:

```bash
pnpm prisma generate
```

Apply existing migrations:

```bash
pnpm prisma migrate deploy
```

For local development, create and apply development migrations with:

```bash
pnpm prisma migrate dev
```

Start the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

Optional seed command:

```bash
pnpm db:seed
```

## Production Build

Build the application:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

The build script runs `prisma generate` before `next build`, ensuring Prisma Client is generated during production builds.

## Deployment Notes

- Vercel deployment is supported.
- `DATABASE_URL`, `AUTH_SECRET`, and `TWO_FACTOR_ENCRYPTION_KEY` must be configured in Vercel environment variables.
- `NEXT_PUBLIC_SITE_URL` should be set to the production domain, for example `https://your-domain.com`.
- Local `/public/uploads` storage is not persistent on Vercel serverless deployments.
- Future recommended improvement: move uploaded media to Supabase Storage or an S3-compatible object storage provider.

## Security Notes

- Passwords are hashed before storage.
- Admin session tokens are stored as hashes in the database.
- TOTP secrets should be encrypted at rest with `TWO_FACTOR_ENCRYPTION_KEY`.
- Admin routes are protected by middleware and server-side session checks.
- Audit logs track sensitive actions such as login, logout, password changes, email changes, 2FA events, content changes, media uploads, and session revocation.

## Roadmap

- Supabase Storage / S3 media storage
- SEO hardening
- Sitemap and `robots.txt`
- Blog module
- Role-based permissions
- Email notification system
- Analytics dashboard

## License

This project is currently for personal portfolio and educational purposes.

## Author

Ali Koroglu

- GitHub: https://github.com/alikorogluts
- LinkedIn: https://linkedin.com/in/alikorogluts
- Email: alikorogluts@gmail.com
