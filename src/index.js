/*
✨ CoonDev • https://dev.coonlink.com/

 ▄█▄    ████▄ ████▄    ▄   ██▄   ▄███▄      ▄
 █▀ ▀▄  █   █ █   █     █  █  █  █▀   ▀      █
 █   ▀  █   █ █   █ ██   █ █   █ ██▄▄   █     █
 █▄  ▄▀ ▀████ ▀████ █ █  █ █  █  █▄   ▄▀ █    █
 ▀███▀              █  █ █ ███▀  ▀███▀    █  █
                    █   ██                 █▐
                                           ▐
*/

import http from 'node:http';
import { config, log, sleep } from './config.js';
import { handleUpdate } from './bot.js';
import { checkSteam } from './checker.js';
import { tg } from './telegram.js';

let offset = 0;
let stopped = false;

async function pollLoop() {
  while (!stopped) {
    try {
      const updates = await tg('getUpdates', {offset,timeout: 30,allowed_updates: ['message', 'my_chat_member']}, { retries: 5 });
      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (e) {
      log('getUpdates failed:', e.message);
      await sleep(3000);
    }
  }
}

function startHealthServer() {
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (u.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('ok');
      return;
    }
    if (u.pathname === '/check') {
      if (!config.checkToken || u.searchParams.get('token') !== config.checkToken) {
        res.writeHead(403, { 'content-type': 'text/plain' });
        res.end('forbidden');
        return;
      }
      res.writeHead(202, { 'content-type': 'text/plain' });
      res.end('accepted');
      checkSteam().catch(e => log('manual check failed:', e.message));
      return;
    }
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  });
  server.listen(config.port, () => log(`health server on :${config.port}`));
}

async function main() {
  if (!config.token) {
    console.error('BOT_TOKEN or TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  startHealthServer();
  await checkSteam({ seed: true });
  setInterval(() => checkSteam().catch(e => log('scheduled check failed:', e.message)), config.intervalMs);
  await pollLoop();
}

process.on('SIGINT', () => { stopped = true; process.exit(0); });
process.on('SIGTERM', () => { stopped = true; process.exit(0); });

main().catch(e => {
  console.error(e);
  process.exit(1);
});
