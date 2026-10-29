/**
 * Sound Drop / 課堂遊戲 — 一次性房間排行榜（Kahoot 式）
 * 部署：Deploy > New deployment > Web app；Execute as: Me；Who has access: Anyone
 * 第一次請先在編輯器執行 setup() 並授權。
 *
 * GET ?a=create&stage=terms           -> {ok, pin}
 * GET ?a=join&pin=&pid=&name=         -> {ok, stage}
 * GET ?a=finish&pin=&pid=&name=&score=&level=&correct=&answered= -> {ok}
 * GET ?a=board&pin=                   -> {ok, stage, rows:[{pid,name,score,level,status,updated}]}
 * 房間及分數保留 3 日，之後自動清除。
 */
const KEEP_MS = 3 * 24 * 3600 * 1000;
const STAGES = ['terms', 'fam', 'mix', 'spot'];

function setup() {
  ss_();
}

function ss_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SS');
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create('課堂遊戲排行榜（自動建立，勿改欄位）');
  const rooms = ss.getSheets()[0];
  rooms.setName('rooms');
  rooms.getRange(1, 1, 1, 3).setValues([['pin', 'stage', 'created']]);
  const scores = ss.insertSheet('scores');
  scores.getRange(1, 1, 1, 9).setValues([['pin', 'pid', 'name', 'score', 'level', 'correct', 'answered', 'status', 'updated']]);
  props.setProperty('SS', ss.getId());
  return ss;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(s, max) {
  s = String(s || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // never let a name become a formula
  return s;
}
function num_(v, lo, hi) {
  const n = Math.round(Number(v));
  return isFinite(n) ? Math.max(lo, Math.min(hi, n)) : lo;
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    switch (p.a) {
      case 'create': return out_(create_(p));
      case 'join': return out_(upsert_(p, 'playing'));
      case 'finish': return out_(upsert_(p, 'done'));
      case 'board': return out_(board_(p));
      default: return out_({ ok: false, error: 'badaction' });
    }
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}

function roomOf_(pin) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('room' + pin);
  if (hit) return JSON.parse(hit);
  const sh = ss_().getSheetByName('rooms');
  const f = sh.getRange('A:A').createTextFinder(String(pin)).matchEntireCell(true).findNext();
  if (!f || f.getRow() === 1) return null;
  const row = sh.getRange(f.getRow(), 1, 1, 3).getValues()[0];
  if (Date.now() - Number(row[2]) > KEEP_MS) return null;
  const room = { pin: String(row[0]), stage: String(row[1]) };
  cache.put('room' + pin, JSON.stringify(room), 21600);
  return room;
}

function create_(p) {
  const stage = STAGES.indexOf(p.stage) >= 0 ? p.stage : 'terms';
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    purge_();
    const sh = ss_().getSheetByName('rooms');
    let pin;
    for (let i = 0; i < 30; i++) {
      pin = String(100000 + Math.floor(Math.random() * 900000));
      if (!roomOf_(pin)) break;
    }
    sh.appendRow([pin, stage, Date.now()]);
    sh.getRange(sh.getLastRow(), 1).setNumberFormat('@').setValue(pin);
    return { ok: true, pin: pin, stage: stage };
  } finally { lock.releaseLock(); }
}

function upsert_(p, status) {
  const pin = String(p.pin || '');
  const room = roomOf_(pin);
  if (!room) return { ok: false, error: 'noroom' };
  const pid = clean_(p.pid, 24).replace(/[^a-z0-9]/gi, '');
  if (!pid) return { ok: false, error: 'nopid' };
  const name = clean_(p.name, 12) || '—';
  const row = [pin, pid, name,
    status === 'done' ? num_(p.score, 0, 100000) : 0,
    status === 'done' ? num_(p.level, 1, 10) : 1,
    status === 'done' ? num_(p.correct, 0, 10000) : 0,
    status === 'done' ? num_(p.answered, 0, 10000) : 0,
    status, Date.now()];
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = ss_().getSheetByName('scores');
    const f = sh.getRange('B:B').createTextFinder(pid).matchEntireCell(true).findNext();
    if (f && f.getRow() > 1) sh.getRange(f.getRow(), 1, 1, 9).setValues([row]);
    else sh.appendRow(row);
    CacheService.getScriptCache().remove('board' + pin);
  } finally { lock.releaseLock(); }
  return { ok: true, stage: room.stage };
}

function board_(p) {
  const pin = String(p.pin || '');
  const cache = CacheService.getScriptCache();
  const hit = cache.get('board' + pin);
  if (hit) return JSON.parse(hit);
  const room = roomOf_(pin);
  if (!room) return { ok: false, error: 'noroom' };
  const sh = ss_().getSheetByName('scores');
  const n = sh.getLastRow() - 1;
  const rows = [];
  if (n > 0) {
    const vals = sh.getRange(2, 1, n, 9).getValues();
    for (const v of vals) {
      if (String(v[0]) !== pin) continue;
      rows.push({ pid: String(v[1]), name: String(v[2]).replace(/^'/, ''), score: Number(v[3]), level: Number(v[4]),
                  correct: Number(v[5]), answered: Number(v[6]), status: String(v[7]), updated: Number(v[8]) });
    }
  }
  const res = { ok: true, stage: room.stage, rows: rows };
  cache.put('board' + pin, JSON.stringify(res), 2);
  return res;
}

function purge_() {
  const ss = ss_();
  const cutoff = Date.now() - KEEP_MS;
  [['rooms', 3, 3], ['scores', 9, 9]].forEach(function (cfg) {
    const sh = ss.getSheetByName(cfg[0]);
    const n = sh.getLastRow() - 1;
    if (n <= 0) return;
    const vals = sh.getRange(2, 1, n, cfg[1]).getValues();
    const keep = vals.filter(function (v) { return Number(v[cfg[2] - 1]) >= cutoff; });
    if (keep.length === vals.length) return;
    sh.getRange(2, 1, n, cfg[1]).clearContent();
    if (keep.length) sh.getRange(2, 1, keep.length, cfg[1]).setValues(keep);
  });
}
