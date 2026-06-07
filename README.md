# portfolio-alikoroglu

Premium engineering portfolio for Ali Koroglu, built with Next.js, React, TypeScript, Tailwind CSS, and Prisma.

## Overview

This project is a recruiter-focused portfolio website with a cinematic dark visual system and a Prisma foundation for a future secure admin panel.

Current public portfolio content is still static and lives in:

```text
components/landing/portfolio-data.ts
```

The Prisma database layer has been added as a foundation only. The public site is not connected to dynamic database content yet.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Prisma 7
- PostgreSQL
- bcryptjs

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## Environment

Create a local `.env` file using `.env.example` as a template:

```bash
cp .env.example .env
```

Required variables:

```text
DATABASE_URL
ADMIN_EMAIL
ADMIN_PASSWORD
AUTH_SECRET
TWO_FACTOR_ENCRYPTION_KEY
```

Never commit `.env`.

## Database

Generate Prisma Client:

```bash
pnpm db:generate
```

Run migrations only after `DATABASE_URL` is configured:

```bash
pnpm db:migrate --name init_admin_foundation
```

Seed the first OWNER admin:

```bash
pnpm db:seed
```

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build production app
pnpm start        # Start production server
pnpm db:generate  # Generate Prisma Client
pnpm db:migrate   # Run Prisma migration
pnpm db:push      # Push Prisma schema
pnpm db:seed      # Seed OWNER admin user
```

## Notes

- Admin UI, middleware, 2FA, and CRUD are planned for later phases.
- Session tokens must be stored only as hashes.
- TOTP secrets should be encrypted at rest when 2FA is implemented.
- Public portfolio design should remain separate from admin implementation work.
