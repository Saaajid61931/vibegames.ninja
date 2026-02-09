# VibeGames.ai

The home for AI-made HTML5 games. Build with AI, publish instantly, play anywhere, and earn from your creations.

## Features

- **Instant Publishing** - Upload HTML5 games and go live in seconds
- **AI-First Platform** - Built for games created with Claude, ChatGPT, Cursor, and other AI tools
- **Revenue Sharing** - Earn 65-85% of ad revenue from your games
- **Creator Dashboard** - Track plays, likes, and earnings in real-time
- **Discovery Engine** - Trending games, categories, and search
- **Sandboxed Play** - Secure iframe-based game player
- **Admin Panel** - Moderation tools for content review

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Auth**: NextAuth.js v5
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vibegames.ai.git
cd vibegames.ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vibegames"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/vibegames"
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="vibegames-assets"
R2_PUBLIC_BASE_URL="https://assets.vibegames.ninja"
```

4. Initialize the database:
```bash
npx prisma db push
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Demo Accounts

After seeding, you can log in with:

- **Admin**: admin@vibegames.ai / admin123
- **Creator**: creator@example.com / creator123

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (main)/            # Main pages (games, creator, admin)
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/
│   ├── dashboard/         # Dashboard components
│   ├── games/             # Game-related components
│   ├── layout/            # Header, Footer
│   └── ui/                # Reusable UI components
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   ├── utils.ts           # Utility functions
│   └── validations.ts     # Zod schemas
├── types/                 # TypeScript types
└── hooks/                 # Custom React hooks

prisma/
├── schema.prisma          # Database schema
└── seed.ts               # Database seed script

public/
└── sample-games/         # Demo games
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed the database
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

## Uploading Games

Games can be uploaded as:
- **Single HTML file** - Self-contained game in one file
- **ZIP archive** - Game folder with `index.html` as entry point

Uploaded files are stored in **Cloudflare R2** under `games/<game-id>/...` and served from `R2_PUBLIC_BASE_URL`.

Maximum file size: 50MB (Free) / 100MB (Pro)

## Monetization

### Revenue Share
- Free: 65% creator / 35% platform
- Pro ($15/mo): 75% creator / 25% platform
- Enterprise: 85% creator / 15% platform

### Paid Games
- Platform fee: 15% on all sales

## API Endpoints

- `GET /api/games` - List games (supports filtering and pagination)
- `POST /api/upload` - Upload new game (authenticated)
- `POST /api/auth/register` - Register new user

## Deployment

### Cloudflare (Recommended for this project)

1. Push this repo to GitHub
2. Provision a managed PostgreSQL database (Neon/Supabase/RDS)
3. Create an R2 bucket and public domain (e.g. `assets.vibegames.ninja`)
4. Create a Cloudflare **Workers** project with Git integration
5. Set build/deploy commands:
   - Build: `npx @opennextjs/cloudflare build`
   - Deploy: `npx @opennextjs/cloudflare deploy`
6. Add all env vars in Cloudflare Worker settings
7. Run `npx prisma db push` against production DB

See the full runbook in `docs/cloudflare-deploy.md`.

### Self-hosted

1. Build the project:
```bash
npm run build
```

2. Start the server:
```bash
npm run start
```

For production, consider:
- Enforcing rate limits on upload endpoints
- Adding monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file

## Support

- Documentation: https://vibegames.ai/docs
- Discord: https://discord.gg/vibegames
- Twitter: https://twitter.com/vibegamesai
