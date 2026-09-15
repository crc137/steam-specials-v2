# steam-specials-v2

Telegram bot that notifies when a Steam game becomes free. Long-polling Node.js version: no Cloudflare Workers, no KV, no webhook required.

## Run

```bash
cp .env.example .env   # then fill in BOT_TOKEN and DATABASE_URL
export BOT_TOKEN='123:abc'
export CC='EE'
export LANG_STEAM='english'
npm start
```

`.env` is loaded automatically at startup (Node's built-in `.env` loader).

Optional env:

- `PORT` — health endpoint port, default `8787`
- `INTERVAL_MINUTES` — Steam check interval, default `10`
- `DATABASE_URL` — Postgres connection string (see `.env.example`)
- `CHECK_TOKEN` — enables protected manual trigger `POST /check?token=...`
- `SEND_DELAY_MS` — delay between Telegram sends, default `40`

## Commands

- `/start` — subscribe
- `/stop` — unsubscribe
- `/now` — show current free games

## Notes

State (subscribers, seen game ids, last check time) is stored in PostgreSQL. Tables are created automatically on startup.
