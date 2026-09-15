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

import { asId, config } from './config.js';

const SEARCH_URL = 'https://store.steampowered.com/search/results/';

function parseGames(html) {
  const games = [];
  const rowRe = /<a[^>]*class=["'][^"']*search_result_row[^"']*["'][^>]*>[\s\S]*?<\/a>/gi;
  for (const match of html.matchAll(rowRe)) {
    const row = match[0];
    const id = row.match(/data-ds-appid=["']([^"']+)["']/i)?.[1];
    const block = row.match(/<div[^>]*class=["'][^"']*discount_block[^"']*["'][^>]*>/i)?.[0] || '';
    const price = block.match(/data-price-final=["']([^"']+)["']/i)?.[1];
    const discount = block.match(/data-discount=["']([^"']+)["']/i)?.[1];
    if (!id || price !== '0' || discount !== '100') continue;
    const titleRaw = row.match(/<div[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || `App ${id}`;
    const title = titleRaw.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    const src = row.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i)?.[1];
    const img = src ? src.replace('capsule_231x87', 'header') : `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`;
    games.push({ appid: asId(id), title, img, url: `https://store.steampowered.com/app/${id}/` });
  }
  const uniq = new Map();
  for (const g of games) if (!uniq.has(g.appid)) uniq.set(g.appid, g);
  return [...uniq.values()];
}

async function fetchSteamPage(start) {
  const url = new URL(SEARCH_URL);
  const params = {hwtype: 0,maxprice: 'free',category1: 998,specials: 1,ndl: 1,json: 1,infinite: 1,start,count: 100,cc: config.cc,l: config.steamLang};
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {headers: {'user-agent': 'Mozilla/5.0 steam-specials-v2','accept-language': 'en-US,en;q=0.9'},signal: AbortSignal.timeout(config.requestTimeoutMs)});
  if (!res.ok) throw new Error(`Steam HTTP ${res.status}`);
  const data = await res.json();
  return parseGames(data.results_html || '');
}

export async function fetchFree() {
  const out = [];
  let start = 0;

  for (let page = 0; page < 20; page++) {
    const games = await fetchSteamPage(start);
    if (!games.length) break;
    out.push(...games);
    if (games.length < 100) break;
    start += 100;
  }

  const uniq = new Map();
  for (const g of out) if (!uniq.has(g.appid)) uniq.set(g.appid, g);
  return [...uniq.values()];
}
