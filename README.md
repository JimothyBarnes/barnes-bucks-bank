# Barnes Bucks Bank

A small family banking app for tracking Barnes Bucks, posting jobs, approving payouts, and redeeming rewards.

## What it includes

- Super-admin setup with a simple PIN
- Kid login by profile picker plus PIN
- Ledger-based balances
- Kid-to-kid transfers
- Job posting, claiming, submission, and approval
- Reward catalog plus approval-based redemption
- Account management for adding kids, resetting PINs, and archiving accounts

## Tech stack

- Next.js App Router
- SQLite with `better-sqlite3`
- Tailwind CSS
- Cookie-based session handling

## Run it locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

4. On first launch, create the super-admin account in the browser.

The SQLite database will be created automatically at `data/barnes-bucks.db`.

## Environment

Create a `.env.local` file with:

```env
SESSION_SECRET=change-this-to-any-random-long-string
```

If you skip this locally, the app still works, but setting it is better before deployment.

## Deploy simply

The easiest deployment path for this app is a host that supports:

- Node.js
- persistent storage for the SQLite file
- one environment variable

Good fits:

- Railway
- Render

### Recommended deploy settings

- Build command: `npm run build`
- Start command: `npm run start`
- Environment variable: `SESSION_SECRET`
- Persistent disk mounted so `data/` survives deploys

If you use a host without persistent disk support, the balances and accounts will reset whenever the app is rebuilt or restarted.

## Notes

- This app is designed for a family fake-money system, not real financial security.
- PINs are hashed before storage.
- Balances are calculated from transactions instead of being manually stored.
