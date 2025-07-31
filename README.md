# Access+ - Educational Opportunities Platform

Access+ é a maior plataforma gratuita do país focada em trazer oportunidades educacionais atualizadas para jovens.

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install
```

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

```bash
# Beehiiv Newsletter Configuration
BEEHIV_PUBLICATION_ID=your_publication_id_here
BEEHIV_API_KEY=your_api_key_here
```

### Getting Beehiiv Credentials

1. Go to your Beehiiv dashboard
2. Navigate to Settings > API
3. Generate an API key
4. Get your publication ID from the URL or API

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
nuxt dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## Productionn

Build the application for productionm:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

Don't forget npx nuxi dev!

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
## Features

- 🎯 Educational opportunities platform
- 📰 Newsletter integration with Beehiiv
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast performance with Nuxt 3
- 🔍 SEO optimized

## Pages

- **Home** (`/`) - Landing page with featured opportunities
- **About** (`/sobre`) - About the platform and team
- **Newsletter** (`/newsletter`) - Latest newsletter posts from Beehiiv
- **Opportunities** (`/oportunidades`) - Browse all educational opportunities
- **Opportunity Details** (`/oportunidade/[id]`) - Individual opportunity pages
