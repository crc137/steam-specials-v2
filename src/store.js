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

import fs from 'node:fs';
import path from 'node:path';
import { asId, config, log } from './config.js';

function emptyState() {return { users: [], seen: [], lastCheckAt: null }}

export class Store {
  constructor(file) {
    this.file = file;
    this.state = emptyState();
    this._queue = Promise.resolve();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.file)) return;
      const raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      this.state = {
        users: Array.isArray(raw.users) ? [...new Set(raw.users.map(asId))] : [],
        seen: Array.isArray(raw.seen) ? [...new Set(raw.seen.map(asId))] : [],
        lastCheckAt: raw.lastCheckAt || null,
      };
    } catch (e) {
      log('state load failed, starting empty:', e.message);
      this.state = emptyState();
    }
  }

  async _write() {
    const tmp = `${this.file}.${process.pid}.tmp`;
    await fs.promises.writeFile(tmp, JSON.stringify(this.state, null, 2));
    await fs.promises.rename(tmp, this.file);
  }

  persist() {
    this._queue = this._queue.then(() => this._write()).catch(e => log('state save failed:', e.message));
    return this._queue;
  }

  async addUser(id) {
    const key = asId(id);
    if (this.state.users.includes(key)) return false;
    this.state.users.push(key);
    await this.persist();
    return true;
  }

  async removeUser(id) {
    const key = asId(id);
    const before = this.state.users.length;
    this.state.users = this.state.users.filter(x => x !== key);
    if (before === this.state.users.length) return false;
    await this.persist();
    return true;
  }

  async markSeen(appids) {
    const keys = Array.isArray(appids) ? appids.map(asId) : [asId(appids)];
    const known = new Set(this.state.seen);
    const fresh = keys.filter(k => !known.has(k));
    if (!fresh.length) return false;
    this.state.seen.push(...fresh);
    await this.persist();
    return true;
  }

  async touch(lastCheckAt = new Date().toISOString()) {
    this.state.lastCheckAt = lastCheckAt;
    await this.persist();
  }

  snapshotUsers() {return [...this.state.users]}
  hasSeen(appid) {return this.state.seen.includes(asId(appid))}
}

export const store = new Store(config.stateFile);
