This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Figma Import

For production-style Figma import, configure OAuth in your local environment:

```bash
FIGMA_CLIENT_ID=your_figma_oauth_client_id
FIGMA_CLIENT_SECRET=your_figma_oauth_client_secret
FIGMA_REDIRECT_URI=http://localhost:3000/api/figma/callback
```

You can place them in `.env.local` before starting the app.

Optional:

```bash
FIGMA_TOKEN_ENCRYPTION_KEY=some_long_random_server_secret
FIGMA_OAUTH_SCOPES=file_content:read,current_user:read
```

`FIGMA_OAUTH_SCOPES` lets you override the requested OAuth scopes if your Figma app is configured differently. The default is `file_content:read,current_user:read`.

If Figma redirects back with `Invalid scopes for app`, update your OAuth app in Figma so it allows the scopes you request here, or set `FIGMA_OAUTH_SCOPES` to an exact subset of the scopes enabled for that app.

For internal testing only, the importer also accepts:

```bash
FIGMA_ACCESS_TOKEN=your_figma_pat
```

`FIGMA_SECRET_TOKEN` is treated as a legacy fallback name for `FIGMA_CLIENT_SECRET`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
