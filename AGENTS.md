# Project rules for agents

This project must NEVER be published or approved for public access. The GitHub repository `crc137/steam-specials-v2` must stay private.

- NEVER commit, upload, or push `package-lock.json`. Do not add it to a commit; do not restore tracking of it. `npm install` will work without it.
- NEVER commit `.env`, secrets, connection strings, passwords, tokens, or the database host/IP/port. All credentials live only in `.env` (gitignored).
- Never push unless the user explicitly asks. When pushing, double-check `git status` and the staged diff for `package-lock.json` and secrets first.