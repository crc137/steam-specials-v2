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

import pg from 'pg';
import { config, log } from './config.js';

const pool = new pg.Pool({ connectionString: config.databaseUrl });

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS steam_users (id text PRIMARY KEY);
  CREATE TABLE IF NOT EXISTS seen_games (appid text PRIMARY KEY);
  CREATE TABLE IF NOT EXISTS app_state (key text PRIMARY KEY, value text NOT NULL);
`;

let schemaPromise = null;
function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = pool.query(SCHEMA).catch(e => { schemaPromise = null; throw e; });
  }
  return schemaPromise;
}

export class Store {
  constructor() {
    this._init = ensureSchema();
  }

  async addUser(id) {
    await this._init;
    const key = String(id);
    const res = await pool.query('INSERT INTO steam_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [key]);
    return res.rowCount > 0;
  }

  async removeUser(id) {
    await this._init;
    const key = String(id);
    const res = await pool.query('DELETE FROM steam_users WHERE id = $1', [key]);
    return res.rowCount > 0;
  }

  async markSeen(appids) {
    await this._init;
    const keys = [...new Set((Array.isArray(appids) ? appids : [appids]).map(String))];
    if (!keys.length) return false;
    const placeholders = keys.map((_, i) => `($${i + 1})`).join(', ');
    const res = await pool.query(`INSERT INTO seen_games (appid) VALUES ${placeholders} ON CONFLICT (appid) DO NOTHING`, keys);
    return res.rowCount > 0;
  }

  async touch(timestamp = new Date().toISOString()) {
    await this._init;
    await pool.query(
      `INSERT INTO app_state (key, value) VALUES ('lastCheckAt', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [timestamp],
    );
  }

  async snapshotUsers() {
    await this._init;
    const res = await pool.query('SELECT id FROM steam_users');
    return res.rows.map(r => r.id);
  }

  async hasSeen(appid) {
    await this._init;
    const res = await pool.query('SELECT 1 FROM seen_games WHERE appid = $1', [String(appid)]);
    return res.rowCount > 0;
  }

  async seenSet() {
    await this._init;
    const res = await pool.query('SELECT appid FROM seen_games');
    return new Set(res.rows.map(r => r.appid));
  }

  async close() {
    await pool.end();
  }
}

export const store = new Store();

store._init.catch(e => log('store init failed:', e.message));