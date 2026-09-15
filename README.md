# steam-specials-v2

Telegram bot that notifies when a Steam game becomes free. Long-polling Node.js version: no Cloudflare Workers, no KV, no webhook required.

## Run

```bash
export BOT_TOKEN='123:abc'
export CC='EE'
export LANG_STEAM='english'
mkdir -p data
npm start
```

Optional env:

- `PORT` — health endpoint port, default `8787`
- `INTERVAL_MINUTES` — Steam check interval, default `10`
- `STATE_FILE` — state file path, default `./data/state.json`
- `CHECK_TOKEN` — enables protected manual trigger `POST /check?token=...`
- `SEND_DELAY_MS` — delay between Telegram sends, default `40`

## Commands

- `/start` — subscribe
- `/stop` — unsubscribe
- `/now` — show current free games

## Notes

State is stored as a local JSON file with atomic writes. For a bigger deployment, replace `Store` in `src/store.js` with Postgres/SQLite; the rest of the code talks to `store` only.
