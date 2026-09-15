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

import { log, sleep } from './config.js';
import { fetchFree } from './steam.js';
import { store } from './store.js';
import { sendGame, tg } from './telegram.js';

const HELP = '/start — subscribe to notifications\n/stop — unsubscribe\n/now — see what is free now';

async function allowed(chat, from) {
  if (!chat) return false;
  if (chat.type === 'private') return true;
  if (!from) return false;
  try {
    const m = await tg('getChatMember', { chat_id: chat.id, user_id: from.id });
    return m.status === 'administrator' || m.status === 'creator';
  } catch (e) {
    log('permission check failed', e.message);
    return false;
  }
}

export async function handleNow(chatId) {
  try {
    const games = await fetchFree();
    if (!games.length) {
      await tg('sendMessage', { chat_id: chatId, text: 'There are no free giveaways at the moment.' });
      return;
    }
    for (const game of games.slice(0, 10)) {
      await sendGame(chatId, game);
      await sleep(100);
    }
  } catch (e) {
    log('/now failed', e.message);
    await tg('sendMessage', { chat_id: chatId, text: 'Failed to check Steam right now.' }).catch(() => {});
  }
}

export async function handleMessage(message) {
  const chat = message.chat;
  const text = message.text || '';
  const command = (text.trim().split(/\s+/)[0] || '').toLowerCase().split('@')[0];
  if (!['/start', '/stop', '/now'].includes(command)) return;
  if (!(await allowed(chat, message.from))) return;

  if (command === '/start') {
    const added = await store.addUser(chat.id);
    await tg('sendMessage', {chat_id: chat.id,text: `${added ? "Subscription activated. I'll notify you as soon as there's a free giveaway on Steam.\n\n" : 'You are already subscribed.\n\n'}${HELP}`,link_preview_options: { is_disabled: true }});
  } else if (command === '/stop') {
    const removed = await store.removeUser(chat.id);
    await tg('sendMessage', { chat_id: chat.id, text: removed ? 'Unsubscribed.' : 'You were not subscribed.' });
  } else if (command === '/now') {
    await handleNow(chat.id);
  }
}

export async function handleMyChatMember(update) {
  const u = update.my_chat_member;
  const chat = u?.chat;
  if (!chat || chat.type === 'private') return;
  const joined = ['member', 'administrator', 'creator'].includes(u.new_chat_member?.status);
  if (joined) await store.addUser(chat.id);
  else await store.removeUser(chat.id);
}

export async function handleUpdate(update) {
  if (update.message) await handleMessage(update.message);
  if (update.my_chat_member) await handleMyChatMember(update);
}
