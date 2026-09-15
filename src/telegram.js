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

import { config, esc, sleep } from './config.js';

export async function tg(method, body, { retries = 3 } = {}) {
  const url = `https://api.telegram.org/bot${config.token}/${method}`;
  let lastErr;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {method: 'POST',headers: { 'content-type': 'application/json' },body: JSON.stringify(body),signal: AbortSignal.timeout(config.requestTimeoutMs)});
      const data = await res.json().catch(() => ({}));
      if (data.ok) return data.result;
      const err = new Error(data.description || `Telegram ${method} failed`);
      err.error_code = data.error_code;
      err.parameters = data.parameters || {};
      lastErr = err;
      const retryAfter = Number(err.parameters?.retry_after || 0);
      if (retryAfter > 0 && attempt < retries) {
        await sleep(retryAfter * 1000 + 250);
        continue;
      }
      throw err;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw lastErr;
    }
  }

  throw lastErr;
}

export function caption(game) {return `<b>${esc(game.title)}</b>\nFree on Steam — yours to keep forever.`}
export function keyboard(game) {return { inline_keyboard: [[{ text: 'Get on Steam', url: game.url }]] }}

export async function sendGame(chatId, game) {
  try {
    await tg('sendPhoto', {chat_id: chatId,photo: game.img,caption: caption(game),parse_mode: 'HTML',reply_markup: keyboard(game)});
  } catch (e) {
    if (e.error_code === 400 || String(e.message).toLowerCase().includes('bad request')) {
      await tg('sendMessage', {chat_id: chatId,text: caption(game),parse_mode: 'HTML',reply_markup: keyboard(game),link_preview_options: { is_disabled: true }});
      return;
    }
    throw e;
  }
}
