#!/usr/bin/env node
/**
 * Derives the public toneScan page from the full one.
 *
 * templates/page.tonescan-lite.json is not maintained; it is generated. It is the full template
 * with the in-progress sections removed, and nothing else: every section it does keep is copied
 * across verbatim, so the two can never disagree about a heading, an image or a block.
 *
 * The list in lite-sections.json is an ALLOWLIST. A section added to the full template does not
 * appear on the public page until its key is named there. That is the whole point: work is in
 * progress until someone says it is not, and an oversight should leave a section hidden rather
 * than publish it.
 *
 *   npm run lite                  regenerate
 *   npm run lite:check            fail if the file on disk is not what would be generated
 *   npm run lite:list             what is public, what is held back
 *   npm run lite:add <key...>     publish a section, then regenerate
 *   npm run lite:remove <key...>  hold one back, then regenerate
 *
 * The one rule this asks of you: edit the FULL template. Anything typed into lite, in the theme
 * editor or by hand, is overwritten the next time this runs.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FULL = join(ROOT, 'templates/page.tonescan.json');
const LITE = join(ROOT, 'templates/page.tonescan-lite.json');
const LIST = join(ROOT, 'lite-sections.json');

const BANNER =
  `/*\n` +
  ` * ------------------------------------------------------------\n` +
  ` * GENERATED FILE. Do not edit, and do not edit it in the theme\n` +
  ` * editor either: run \`npm run lite\` and your changes are gone.\n` +
  ` *\n` +
  ` * This is templates/page.tonescan.json with the sections that\n` +
  ` * are still in progress removed. Edit that one. To change which\n` +
  ` * sections are public, see lite-sections.json.\n` +
  ` * ------------------------------------------------------------\n` +
  ` */\n`;

// Shopify writes a comment block above the JSON in these files, which JSON.parse will not accept.
const readTemplate = (p) => JSON.parse(readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//, ''));
const readList = () => JSON.parse(readFileSync(LIST, 'utf8'));
const writeList = (l) => writeFileSync(LIST, JSON.stringify(l, null, 2) + '\n');

function build() {
  const full = readTemplate(FULL);
  const { onLite } = readList();
  const order = full.order || [];

  // A key that no longer exists is a section someone deleted from the full template while it was
  // still public. Silently dropping it would hide that, so it stops here.
  const orphans = onLite.filter((k) => !order.includes(k));
  if (orphans.length) {
    throw new Error(
      `lite-sections.json names ${orphans.length} section(s) that are not in the full template: ` +
        `${orphans.join(', ')}. Remove them with \`npm run lite:remove <key>\`.`
    );
  }

  // Order comes from the full template, never from the allowlist, so the two pages can never
  // present the same sections in a different sequence.
  const keep = order.filter((k) => onLite.includes(k));
  const out = {};
  for (const [k, v] of Object.entries(full)) {
    if (k === 'sections' || k === 'order') continue;
    out[k] = v;                                   // layout, wrapper, and anything Shopify adds later
  }
  out.sections = Object.fromEntries(keep.map((k) => [k, full.sections[k]]));
  out.order = keep;

  return { text: BANNER + JSON.stringify(out, null, 2) + '\n', keep, order, onLite };
}

const cmd = process.argv[2] || 'sync';
const args = process.argv.slice(3);

try {
  if (cmd === 'sync') {
    const { text, keep, order } = build();
    writeFileSync(LITE, text);
    console.log(`lite: ${keep.length} of ${order.length} sections published`);
    console.log(`      ${keep.join(', ')}`);
  } else if (cmd === 'check') {
    const { text, keep, order } = build();
    const onDisk = readFileSync(LITE, 'utf8');
    if (onDisk !== text) {
      console.error('lite: templates/page.tonescan-lite.json is out of date.');
      console.error('      Something was edited on lite directly, or the full template changed.');
      console.error('      Run `npm run lite` and commit the result.');
      process.exit(1);
    }
    console.log(`lite: up to date (${keep.length} of ${order.length} sections published)`);
  } else if (cmd === 'list') {
    const { order, onLite } = build();
    const full = readTemplate(FULL);
    for (const k of order) {
      const on = onLite.includes(k);
      console.log(`  ${on ? 'public ' : 'wip    '} ${k.padEnd(20)} ${full.sections[k].type}`);
    }
  } else if (cmd === 'add' || cmd === 'remove') {
    if (!args.length) throw new Error(`\`${cmd}\` needs at least one section key. See \`npm run lite:list\`.`);
    const full = readTemplate(FULL);
    const list = readList();
    for (const k of args) {
      if (cmd === 'add' && !(full.order || []).includes(k)) {
        throw new Error(`no section "${k}" in the full template. See \`npm run lite:list\`.`);
      }
      const has = list.onLite.includes(k);
      if (cmd === 'add' && !has) list.onLite.push(k);
      if (cmd === 'remove' && has) list.onLite.splice(list.onLite.indexOf(k), 1);
      console.log(`  ${cmd === 'add' ? 'published' : 'held back'}: ${k}${has === (cmd === 'add') ? ' (no change)' : ''}`);
    }
    // stored in the full template's order, so the file reads like the page
    list.onLite = (full.order || []).filter((k) => list.onLite.includes(k));
    writeList(list);
    const { text, keep, order } = build();
    writeFileSync(LITE, text);
    console.log(`lite: ${keep.length} of ${order.length} sections published`);
  } else {
    throw new Error(`unknown command "${cmd}". Try sync, check, list, add, remove.`);
  }
} catch (err) {
  console.error(`lite: ${err.message}`);
  process.exit(1);
}
