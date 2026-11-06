#!/usr/bin/env node
/**
 * CropWise translation pipeline – whole sentences, not words.
 *
 *   node tools/i18n/translate.mjs translate --lang=ta,te,mr --provider=bhashini
 *   node tools/i18n/translate.mjs review-export --lang=ta      # safety sentences → CSV for a native speaker
 *   node tools/i18n/translate.mjs review-import --lang=ta --file=review-ta.csv
 *   node tools/i18n/translate.mjs check                        # coverage per language
 *
 * Providers (set the env vars shown):
 *   bhashini     BHASHINI_API_KEY, optional BHASHINI_URL, BHASHINI_SERVICE_ID
 *   indictrans2  INDICTRANS2_URL – a small self-hosted HTTP wrapper around AI4Bharat IndicTrans2
 *                (POST {sentences, src_lang, tgt_lang} → {translations})
 *   google       GOOGLE_TRANSLATE_KEY
 *   dry          no network; copies English and marks every key "needs translation" (for testing)
 *
 * Safety rules built in:
 *   - {{placeholders}} (doses, days, names) are replaced by tokens before sending, then restored,
 *     so a translation can never change a number.
 *   - Glossary terms (product names, PHI, CIB&RC…) are protected the same way; per-language
 *     preferred terms (e.g. local disease names) are substituted after translation.
 *   - Existing human-reviewed translations are never overwritten unless --force is passed.
 *   - Safety-critical keys are listed in the review CSV so a native speaker checks them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOCALES = path.resolve(HERE, '../../app/src/i18n/locales');
const GLOSSARY = JSON.parse(fs.readFileSync(path.join(HERE, 'glossary.json'), 'utf8'));
const META_FILE = path.join(HERE, 'reviewed.json');

const FLORES = {
  hi: 'hin_Deva', kn: 'kan_Knda', ta: 'tam_Taml', te: 'tel_Telu', mr: 'mar_Deva', bn: 'ben_Beng',
  gu: 'guj_Gujr', pa: 'pan_Guru', ml: 'mal_Mlym', or: 'ory_Orya',
};
const SAFETY = /(phi|harvest|ppe|wear|promise|dose|toxic|gate|ackLabel|ackHint|ackDone|showDosage|warning|firstAid|safety|chemLine|tankLine|poison|disposal|storage|reentry|dontHarvest|lowConfidence|unsure)/i;

/* ---------------- helpers ---------------- */

const args = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const cmd = process.argv[2];

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

function unflatten(flat) {
  const out = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let node = out;
    parts.slice(0, -1).forEach((p) => (node = node[p] ??= {}));
    node[parts.at(-1)] = value;
  }
  return out;
}

const readLocale = (lang) => {
  const f = path.join(LOCALES, `${lang}.json`);
  return fs.existsSync(f) ? flatten(JSON.parse(fs.readFileSync(f, 'utf8'))) : {};
};
const writeLocale = (lang, flat) => fs.writeFileSync(path.join(LOCALES, `${lang}.json`), `${JSON.stringify(unflatten(flat), null, 2)}\n`);
const readMeta = () => (fs.existsSync(META_FILE) ? JSON.parse(fs.readFileSync(META_FILE, 'utf8')) : {});

/** Replace placeholders and protected terms with tokens the engines leave alone. */
function protect(text) {
  const kept = [];
  let out = text.replace(/\{\{[^}]+\}\}/g, (m) => `⟦${kept.push(m) - 1}⟧`);
  for (const term of GLOSSARY.keep) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'gu'), (m) => `⟦${kept.push(m) - 1}⟧`);
  }
  return { out, kept };
}

function restore(text, kept, lang) {
  let out = text.replace(/⟦\s*(\d+)\s*⟧/g, (_, i) => kept[Number(i)] ?? '');
  for (const [en, map] of Object.entries(GLOSSARY.preferred)) {
    if (map[lang]) out = out.replace(new RegExp(en, 'gi'), map[lang]);
  }
  const lost = kept.filter((k) => !out.includes(k));
  return { out, lost };
}

/* ---------------- providers ---------------- */

async function viaBhashini(sentences, lang) {
  const key = process.env.BHASHINI_API_KEY;
  if (!key) throw new Error('Set BHASHINI_API_KEY');
  const url = process.env.BHASHINI_URL ?? 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
  const serviceId = process.env.BHASHINI_SERVICE_ID ?? 'ai4bharat/indictrans-v2-all-gpu--t4';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: key },
    body: JSON.stringify({
      pipelineTasks: [{ taskType: 'translation', config: { language: { sourceLanguage: 'en', targetLanguage: lang }, serviceId } }],
      inputData: { input: sentences.map((source) => ({ source })) },
    }),
  });
  if (!res.ok) throw new Error(`Bhashini HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.pipelineResponse[0].output.map((o) => o.target);
}

async function viaIndicTrans2(sentences, lang) {
  const url = process.env.INDICTRANS2_URL;
  if (!url) throw new Error('Set INDICTRANS2_URL');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sentences, src_lang: 'eng_Latn', tgt_lang: FLORES[lang] }),
  });
  if (!res.ok) throw new Error(`IndicTrans2 HTTP ${res.status}`);
  return (await res.json()).translations;
}

async function viaGoogle(sentences, lang) {
  const key = process.env.GOOGLE_TRANSLATE_KEY;
  if (!key) throw new Error('Set GOOGLE_TRANSLATE_KEY');
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: sentences, source: 'en', target: lang, format: 'text' }),
  });
  if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
  return (await res.json()).data.translations.map((t) => t.translatedText);
}

const PROVIDERS = { bhashini: viaBhashini, indictrans2: viaIndicTrans2, google: viaGoogle, dry: async (s) => s };

/* ---------------- commands ---------------- */

async function translate() {
  const langs = String(args.lang ?? Object.keys(FLORES).join(',')).split(',');
  const provider = PROVIDERS[args.provider ?? 'dry'];
  if (!provider) throw new Error(`Unknown provider ${args.provider}`);
  const en = readLocale('en');
  const meta = readMeta();
  const batch = Number(args.batch ?? 25);

  for (const lang of langs) {
    if (!FLORES[lang]) throw new Error(`Unsupported language ${lang}`);
    const current = readLocale(lang);
    const reviewed = new Set(meta[lang]?.reviewed ?? []);
    const todo = Object.keys(en).filter((k) => args.force ? !reviewed.has(k) : current[k] === undefined);
    console.log(`${lang}: ${todo.length} sentences to translate`);
    const problems = [];
    for (let i = 0; i < todo.length; i += batch) {
      const keys = todo.slice(i, i + batch);
      const prepared = keys.map((k) => protect(String(en[k])));
      const results = await provider(prepared.map((p) => p.out), lang);
      keys.forEach((k, j) => {
        const { out, lost } = restore(results[j] ?? '', prepared[j].kept, lang);
        if (lost.length) {
          problems.push(`${k}: lost ${lost.join(', ')}`);
          return; // never ship a sentence that dropped a number or placeholder
        }
        current[k] = out;
      });
      process.stdout.write(`  ${Math.min(i + batch, todo.length)}/${todo.length}\r`);
    }
    writeLocale(lang, current);
    meta[lang] = { ...(meta[lang] ?? {}), machine: [...new Set([...(meta[lang]?.machine ?? []), ...todo])], reviewed: [...reviewed] };
    if (problems.length) console.warn(`\n  ${problems.length} sentences kept in English because a placeholder was lost:\n  ${problems.join('\n  ')}`);
    console.log(`\n${lang}: written`);
  }
  fs.writeFileSync(META_FILE, `${JSON.stringify(meta, null, 2)}\n`);
}

const csvCell = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;

function reviewExport() {
  const lang = args.lang;
  const en = readLocale('en');
  const tr = readLocale(lang);
  const reviewed = new Set(readMeta()[lang]?.reviewed ?? []);
  const rows = Object.keys(en).filter((k) => (args.all || SAFETY.test(k)) && !reviewed.has(k));
  const file = args.file ?? `review-${lang}.csv`;
  fs.writeFileSync(file, ['key,english,translation,corrected', ...rows.map((k) => [k, en[k], tr[k] ?? '', ''].map(csvCell).join(','))].join('\n'));
  console.log(`${rows.length} sentences for review → ${file}. Fill the "corrected" column (leave empty if the translation is right).`);
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function reviewImport() {
  const lang = args.lang;
  const tr = readLocale(lang);
  const meta = readMeta();
  const reviewed = new Set(meta[lang]?.reviewed ?? []);
  const [, ...rows] = parseCsv(fs.readFileSync(args.file, 'utf8'));
  let changed = 0;
  for (const [key, , translation, corrected] of rows) {
    if (!key) continue;
    const final = corrected?.trim() || translation;
    if (final) { tr[key] = final; reviewed.add(key); changed++; }
  }
  writeLocale(lang, tr);
  meta[lang] = { ...(meta[lang] ?? {}), reviewed: [...reviewed] };
  fs.writeFileSync(META_FILE, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`${lang}: ${changed} sentences marked as reviewed`);
}

function check() {
  const en = Object.keys(readLocale('en'));
  const meta = readMeta();
  for (const lang of Object.keys(FLORES)) {
    const tr = readLocale(lang);
    const have = en.filter((k) => tr[k] !== undefined).length;
    const safety = en.filter((k) => SAFETY.test(k));
    const reviewed = new Set(meta[lang]?.reviewed ?? []);
    console.log(`${lang}: ${have}/${en.length} translated · safety reviewed ${safety.filter((k) => reviewed.has(k)).length}/${safety.length}`);
  }
}

const COMMANDS = { translate, 'review-export': reviewExport, 'review-import': reviewImport, check };
if (!COMMANDS[cmd]) {
  console.log('Usage: translate | review-export | review-import | check   (see header of this file)');
  process.exit(1);
}
await COMMANDS[cmd]();
