#!/usr/bin/env node
/**
 * Build version-since.json: for every Host/Client Service, Host/Client Event,
 * Slot and Factory, the first DSH release tag whose generated Cordis inspect
 * catalogs list it.
 *
 *   node scripts/build-versions.cjs [--download]
 *
 * Inputs (checked in under .scan/upstream/, gitignored, re-fetchable):
 *   <tag>/packages_extensions_tool-cordis_src_api-catalog.ts
 *   <tag>/packages_extensions_cordis-client-runner_src_client_api-catalog.ts
 *   <tag>/packages_extensions_cordis-client-runner_src_client_slot-catalog.ts
 *
 * `--download` fetches missing tag catalogs from raw.githubusercontent.com.
 * Without it the script only reads files already on disk.
 *
 * The catalogs are generated from source by DSH (`gen-cordis-inspect-catalog`,
 * `gen-client-catalog`), so a name first appearing in tag T is the version the
 * interface first shipped in. Names already present in the oldest tracked tag
 * are labelled "≤ <oldest>" because earlier releases are not tracked.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const UPSTREAM = path.join(ROOT, '.scan', 'upstream');
const RAW = 'https://raw.githubusercontent.com/deepseek-ai/deepseek-harness';

// Oldest -> newest; the order comes from the release tag list of
// deepseek-ai/deepseek-harness. Every tag in this list has the three catalogs.
const TAGS = [
  'dsh-v0.1.0-rc.7', 'dsh-v0.1.0-rc.8', 'dsh-v0.1.1-rc.1', 'dsh-v0.1.1-rc.2',
  'dsh-v0.1.2-alpha.1', 'dsh-v0.1.2-alpha.2', 'dsh-v0.1.2-alpha.3', 'dsh-v0.1.2-alpha.4',
  'dsh-v0.1.2-alpha.5', 'dsh-v0.1.2-rc.1',
  'dsh-v0.1.3-alpha.1', 'dsh-v0.1.3-alpha.2',
  'dsh-v0.1.5-alpha.1', 'dsh-v0.1.5-alpha.2', 'dsh-v0.1.5-rc.1', 'dsh-v0.1.5-rc.2', 'dsh-v0.1.5-rc.3',
  'dsh-v0.1.6-alpha.1', 'dsh-v0.1.6-alpha.2',
  'dsh-v0.1.7-alpha.1', 'dsh-v0.1.7-alpha.2', 'dsh-v0.1.7-rc.1', 'dsh-v0.1.7-rc.2',
  'dsh-v0.2.0-rc.1', 'dsh-v0.2.0-rc.2',
  'dsh-v0.2.1-alpha.1', 'dsh-v0.2.1-alpha.2', 'dsh-v0.2.1-alpha.3', 'dsh-v0.2.1-alpha.4',
  'dsh-v0.2.1-alpha.5', 'dsh-v0.2.1-rc.1', 'dsh-v0.2.1-rc.2', 'dsh-v0.2.1-rc.3',
];
const CURRENT = TAGS[TAGS.length - 1];
const OLDEST = TAGS[0];

const CATALOGS = {
  host: 'packages/extensions/tool-cordis/src/api-catalog.ts',
  client: 'packages/extensions/cordis-client-runner/src/client/api-catalog.ts',
  slots: 'packages/extensions/cordis-client-runner/src/client/slot-catalog.ts',
  slotsDoc: 'docs/subsystems/slots.md',
  workspaceToasts: 'packages/client/ui-workspace/src/client/toast/register.ts',
  conversationApply: 'packages/client/ui-conversation/src/client/apply.ts',
  chatApply: 'packages/client/ui-chat/src/client/apply.ts',
  reasoningRenderer: 'packages/client/ui-chat/src/client/chat/register-node-renderers.ts',
  attachmentIndex: 'packages/client/ui-attachment/src/client/index.ts',
};
const FILE_NAME = Object.fromEntries(
  Object.entries(CATALOGS).map(([key, file]) => [key, file.replaceAll('/', '_')]),
);

function tagDir(tag) {
  return path.join(UPSTREAM, tag);
}

const REQUIRED = new Set(['host', 'client', 'slots']);

function downloadMissing() {
  for (const tag of TAGS) {
    const dir = tagDir(tag);
    fs.mkdirSync(dir, { recursive: true });
    for (const [key, file] of Object.entries(CATALOGS)) {
      const out = path.join(dir, FILE_NAME[key]);
      if (fs.existsSync(out) && fs.statSync(out).size > 0) continue;
      const url = `${RAW}/${tag}/${file}`;
      process.stdout.write(`download ${tag} ${key}\n`);
      try {
        execFileSync('curl', ['-sf', '--retry', '3', '--retry-delay', '2', '--max-time', '60', url, '-o', out]);
      } catch {
        // Optional evidence files (docs, source) only exist from some tags on.
        if (REQUIRED.has(key)) {
          console.error(`FAILED ${tag} ${file}`);
          process.exitCode = 1;
        }
      }
    }
  }
}

function read(tag, key) {
  const file = path.join(tagDir(tag), FILE_NAME[key]);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start < 0) return '';
  const end = endMarker === undefined ? text.length : text.indexOf(endMarker, start);
  return text.slice(start, end < 0 ? text.length : end);
}

/** Service keys: 4-space-indented `key: '...'` inside SERVICE_API. */
function serviceKeys(text) {
  const api = section(text, 'export const SERVICE_API', 'export const EVENT_API');
  return [...api.matchAll(/^ {4}key: '([^']+)'/gm)].map((match) => match[1]);
}

/** Event names: 4-space-indented `name: '...'` inside EVENT_API. */
function eventNames(text) {
  const api = section(text, 'export const EVENT_API', text.includes('export const TYPE_API') ? 'export const TYPE_API' : undefined);
  return [...api.matchAll(/^ {4}name: '([^']+)'/gm)].map((match) => match[1]);
}

function parseTag(tag) {
  const host = read(tag, 'host');
  const client = read(tag, 'client');
  const slots = read(tag, 'slots');
  if (host === null || client === null || slots === null) return null;
  const slotApi = section(slots, 'export const CLIENT_SLOT_API');
  // Factories have no generated catalog of their own: gather every source hint
  // (declaredBy strings, the subsystem doc, and the apply/register files that
  // declare them). Factories are labelled "<= first evidence" because a file
  // move between releases can hide older evidence.
  const evidence = [
    slots,
    read(tag, 'slotsDoc'),
    read(tag, 'workspaceToasts'),
    read(tag, 'conversationApply'),
    read(tag, 'chatApply'),
    read(tag, 'reasoningRenderer'),
    read(tag, 'attachmentIndex'),
  ].filter((text) => text !== null);
  const factories = new Set();
  for (const text of evidence) {
    for (const match of text.matchAll(/factory \\'([^'\\]+)\\'/g)) factories.add(match[1]);
    for (const match of text.matchAll(/Factory: ([a-z0-9][a-z0-9_.-]*)/g)) factories.add(match[1]);
    for (const match of text.matchAll(/registerFactory\(\{[^}]*?name: '([^']+)'/gs)) factories.add(match[1]);
  }
  return {
    hostServices: serviceKeys(host),
    hostEvents: eventNames(host),
    clientServices: serviceKeys(client),
    clientEvents: eventNames(client),
    slots: [...slotApi.matchAll(/^ {4}key: '([^']+)'/gm)].map((match) => match[1]),
    factories: [...factories],
  };
}

function firstSeen(tagData, tags, key, field) {
  for (const tag of tags) {
    const data = tagData.get(tag);
    if (data && data[field].includes(key)) return tag;
  }
  return null;
}

function versionOf(tag) {
  return tag.replace(/^dsh-v/, '');
}

function upsert(target, key, tag) {
  if (tag === null) return;
  const since = versionOf(tag);
  target[key] = tag === OLDEST ? { since, base: true } : { since };
}

/** The live rc.3 inject surface: the authoritative "current" name sets. */
function readLiveSets() {
  const dir = path.join(ROOT, '.scan');
  try {
    const hostServices = JSON.parse(fs.readFileSync(path.join(dir, 'host-Service-listService.full.json'), 'utf8')).data.services.map((s) => s.key);
    const hostEvents = JSON.parse(fs.readFileSync(path.join(dir, 'host-Event-listEvents.json'), 'utf8')).data.events.map((e) => e.name);
    const clientServices = JSON.parse(fs.readFileSync(path.join(dir, 'client-Service-listService.json'), 'utf8')).data.services.map((s) => s.key);
    const clientEvents = JSON.parse(fs.readFileSync(path.join(dir, 'client-Event-listEvents.json'), 'utf8')).data.events.map((e) => e.name);
    const slots = [];
    const factories = [];
    const walk = (node) => {
      (node.type === 'factory' ? factories : slots).push(node.name);
      for (const child of node.children ?? []) walk(child);
    };
    for (const tree of JSON.parse(fs.readFileSync(path.join(dir, 'client-Slots-listSubTree.full.json'), 'utf8')).data.trees) walk(tree);
    return { hostServices, hostEvents, clientServices, clientEvents, slots, factories };
  } catch (error) {
    console.warn('live sets unavailable, falling back to the newest tag catalog:', error.message);
    return null;
  }
}

function main() {
  if (process.argv.includes('--download')) downloadMissing();

  const tagData = new Map();
  const missingTags = [];
  for (const tag of TAGS) {
    const parsed = parseTag(tag);
    if (parsed === null) {
      missingTags.push(tag);
      continue;
    }
    tagData.set(tag, parsed);
    console.log(
      tag, 'host', parsed.hostServices.length, '/', parsed.hostEvents.length,
      'client', parsed.clientServices.length, '/', parsed.clientEvents.length,
      'slots', parsed.slots.length, 'factories', parsed.factories.length,
    );
  }
  if (missingTags.length > 0) {
    console.error(`missing release-tag catalogs for ${missingTags.length} tag(s): ${missingTags.join(', ')}`);
    process.exitCode = 1;
  }
  const current = tagData.get(CURRENT);
  if (current === undefined) {
    console.error(
      `missing required release-tag catalogs under .scan/upstream/ (current tag ${CURRENT}).\n`
      + 'Run: node scripts/build-versions.cjs --download',
    );
    process.exit(1);
  }

  const output = {
    generatedAt: new Date().toISOString().slice(0, 10),
    method: 'First DSH release tag whose generated Cordis inspect catalogs list the name; versions are read from .scan/upstream/<tag>/ catalogs generated by DSH itself.',
    source: 'https://github.com/deepseek-ai/deepseek-harness tags',
    trackedFrom: versionOf(OLDEST),
    currentVersion: versionOf(CURRENT),
    host: { services: {}, events: {} },
    client: { services: {}, events: {} },
    slots: {},
    factories: {},
  };

  const live = readLiveSets() ?? {
    hostServices: current.hostServices,
    hostEvents: current.hostEvents,
    clientServices: current.clientServices,
    clientEvents: current.clientEvents,
    slots: current.slots,
    factories: current.factories,
  };
  for (const key of live.hostServices) upsert(output.host.services, key, firstSeen(tagData, TAGS, key, 'hostServices'));
  for (const key of live.hostEvents) upsert(output.host.events, key, firstSeen(tagData, TAGS, key, 'hostEvents'));
  for (const key of live.clientServices) upsert(output.client.services, key, firstSeen(tagData, TAGS, key, 'clientServices'));
  for (const key of live.clientEvents) upsert(output.client.events, key, firstSeen(tagData, TAGS, key, 'clientEvents'));
  for (const key of live.slots) upsert(output.slots, key, firstSeen(tagData, TAGS, key, 'slots'));
  for (const key of live.factories) {
    const tag = firstSeen(tagData, TAGS, key, 'factories');
    if (tag !== null) output.factories[key] = { since: versionOf(tag), base: true };
  }

  // Sanity: every live name must be listed by the newest tag's catalogs.
  const checks = live === null ? [] : [
    ['host services', live.hostServices.length, current.hostServices.length, live.hostServices.every((name) => current.hostServices.includes(name))],
    ['host events', live.hostEvents.length, current.hostEvents.length, live.hostEvents.every((name) => current.hostEvents.includes(name))],
    ['client services', live.clientServices.length, current.clientServices.length, live.clientServices.every((name) => current.clientServices.includes(name))],
    ['client events', live.clientEvents.length, current.clientEvents.length, live.clientEvents.every((name) => current.clientEvents.includes(name))],
    ['slots', live.slots.length, current.slots.length, live.slots.every((name) => current.slots.includes(name))],
    ['factories', live.factories.length, current.factories.length, live.factories.every((name) => current.factories.includes(name))],
  ];
  let failed = false;
  for (const [label, liveCount, tagCount, subset] of checks) {
    // The generated host catalog also lists internal `cordis/*` instrumentation
    // events the live inspect Event provider filters; catalog supersets are OK.
    const ok = subset;
    if (!ok) failed = true;
    const countNote = liveCount === tagCount ? '' : ` (catalog also has ${tagCount - liveCount} non-inspect entries)`;
    console.log(`check ${label}: live ${liveCount}, catalog ${tagCount}, every-live-listed=${subset} ${ok ? 'OK' : 'MISSING'}${countNote}`);
  }
  if (failed) process.exitCode = 1;

  const target = path.join(ROOT, 'version-since.json');
  fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
  const counts = {
    hostServices: Object.keys(output.host.services).length,
    hostEvents: Object.keys(output.host.events).length,
    clientServices: Object.keys(output.client.services).length,
    clientEvents: Object.keys(output.client.events).length,
    slots: Object.keys(output.slots).length,
    factories: Object.keys(output.factories).length,
  };
  console.log('version-since.json:', JSON.stringify(counts));
  const newest = Object.entries({ ...output.host.services, ...output.host.events, ...output.client.services, ...output.client.events, ...output.slots, ...output.factories })
    .filter(([, value]) => value.since === output.currentVersion && value.base !== true)
    .map(([name]) => name);
  console.log(`${output.currentVersion} entries:`, newest.length ? newest.join(', ') : '(none)');
}

main();
