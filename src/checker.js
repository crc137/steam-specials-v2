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

import { config, log, sleep } from './config.js';
import { store } from './store.js';
import { fetchFree } from './steam.js';
import { sendGame } from './telegram.js';

async function broadcast(game) {
  for (const chatId of await store.snapshotUsers()) {
    try {
      await sendGame(chatId, game);
    } catch (e) {
      if (e.parameters?.migrate_to_chat_id) {
        const newId = String(e.parameters.migrate_to_chat_id);
        await store.removeUser(chatId);
        await store.addUser(newId);
        try { await sendGame(newId, game); } catch (x) { log('migrated send failed', newId, x.message); }
      } else if (e.error_code === 403 || String(e.message).toLowerCase().includes('bot was blocked')) {
        await store.removeUser(chatId);
      } else {
        log('send failed', chatId, e.message);
      }
    }
    await sleep(config.sendDelayMs);
  }
}

let checking = false;

export async function checkSteam({ seed = false } = {}) {
  if (checking) return false;
  checking = true;
  try {
    const games = await fetchFree();
    const seen = await store.seenSet();
    const fresh = games.filter(g => !seen.has(g.appid));

    if (seed && seen.size === 0) {
      await store.markSeen(games.map(g => g.appid));
      await store.touch();
      log(`initial seed: ${games.length} games`);
      return true;
    }

    await store.touch();
    if (!fresh.length) {
      log('Steam scan: no new free games');
      return false;
    }

    await store.markSeen(fresh.map(g => g.appid));
    for (const game of fresh) {
      log(`new free: ${game.title} (${game.appid})`);
      await broadcast(game);
    }
    return true;
  } finally {
    checking = false;
  }
}
