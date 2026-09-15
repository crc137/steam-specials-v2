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

try { process.loadEnvFile?.(); } catch {}

export const config = {token: process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '',cc: process.env.CC || 'EE',steamLang: process.env.LANG_STEAM || 'english',port: Number(process.env.PORT || 8787),intervalMs: Math.max(60_000, Number(process.env.INTERVAL_MINUTES || 10) * 60_000),checkToken: process.env.CHECK_TOKEN || '',databaseUrl: process.env.DATABASE_URL || '',sendDelayMs: Math.max(0, Number(process.env.SEND_DELAY_MS || 40)),requestTimeoutMs: Math.max(5_000, Number(process.env.REQUEST_TIMEOUT_MS || 45_000))};
export function log(...args) {console.log(new Date().toISOString(), ...args)}
export function sleep(ms) {return new Promise(r => setTimeout(r, ms))}
export function esc(s) {return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
export function asId(x) {return String(x)}
