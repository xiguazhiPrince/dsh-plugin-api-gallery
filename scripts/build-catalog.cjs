#!/usr/bin/env node
/**
 * Build catalog.json from the Cordis Inspect snapshots in .scan/.
 *
 * These snapshots were captured from the running DSH profile with the
 * cordis_inspect_query tool (platform + provider + method). Keeping them in
 * the repository makes the gallery reproducible: no plugin code needs to
 * introspect the Host at runtime, and readers can diff the catalog against a
 * newer DSH release.
 *
 *   node scripts/build-catalog.cjs
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SCAN = path.join(ROOT, '.scan');

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(SCAN, rel), 'utf8'));
}

function data(rel) {
  return read(rel).data;
}

/** Flatten the Slot/Factory tree into addressable nodes. */
function flattenSlots(tree) {
  const nodes = [];
  const visit = (node, parent) => {
    const entry = {
      type: node.type,
      name: node.name,
      kind: node.kind ?? (node.type === 'factory' ? 'factory' : undefined),
      scope: node.scope,
      purpose: node.purpose,
      replaceRisk: node.replaceRisk,
      parent: parent ?? null,
      registration: node.registration,
      keyDomain: node.keyDomain,
      allowedKeys: node.allowedKeys,
      ownerProps: node.ownerProps,
      standardProps: node.standardProps,
      catalogDescription: node.catalog && node.catalog.description,
    };
    // Drop undefined keys so the JSON stays readable and compact.
    for (const key of Object.keys(entry)) {
      if (entry[key] === undefined) delete entry[key];
    }
    nodes.push(entry);
    for (const child of node.children ?? []) visit(child, node.name);
  };
  visit(tree, null);
  return nodes;
}

const hostServices = data('host-Service-listService.full.json').services;
const hostEvents = data('host-Event-listEvents.json').events;
const clientServices = data('client-Service-listService.json').services;
const clientEvents = data('client-Event-listEvents.json').events;
const clientBuiltins = data('client-Builtin-listBuiltins.json').builtins;
const themeTokens = data('client-Theme-listTokens.json').tokens;
const slotTrees = data('client-Slots-listSubTree.full.json').trees;
const slots = slotTrees.flatMap((tree) => flattenSlots(tree));

// The Inspect directory only carries signatures; keep descriptions and method
// detail small enough to ship to the browser. Full contracts stay in .scan/.
const catalog = {
  meta: {
    title: 'DSH 插件接口目录',
    dshVersion: '0.2.1-rc.2',
    scannedAt: '2026-10-23',
    source: 'cordis_inspect_query (Service / Event / Slots / Theme / Builtin)',
    counts: {
      hostServices: hostServices.length,
      hostEvents: hostEvents.length,
      clientServices: clientServices.length,
      clientEvents: clientEvents.length,
      clientBuiltins: clientBuiltins.length,
      slots: slots.filter((s) => s.type === 'slot').length,
      factories: slots.filter((s) => s.type === 'factory').length,
      themeTokens: themeTokens.length,
    },
  },
  host: {
    services: hostServices.map((service) => ({
      key: service.key,
      description: service.description,
      methods: (service.methods ?? []).map((method) => method.signature),
    })),
    events: hostEvents.map((event) => ({
      name: event.name,
      mode: event.mode,
      description: event.description,
      signature: event.signature,
    })),
  },
  client: {
    services: clientServices.map((service) => ({
      key: service.key,
      description: service.description,
      methods: (service.methods ?? []).map((method) => method.signature),
    })),
    events: clientEvents.map((event) => ({
      name: event.name,
      mode: event.mode,
      description: event.description,
      signature: event.signature,
    })),
    builtins: clientBuiltins.map((builtin) => ({
      name: builtin.name,
      description: builtin.description,
      signatures: builtin.signatures,
    })),
    themeTokens: themeTokens.map((token) => ({
      name: token.name,
      description: token.description,
      valueType: token.valueType,
    })),
    slots,
  },
};

const out = path.join(ROOT, 'catalog.json');
fs.writeFileSync(out, JSON.stringify(catalog, null, 2) + '\n');
console.log(
  'catalog.json:',
  catalog.meta.counts.hostServices, 'host services,',
  catalog.meta.counts.hostEvents, 'host events,',
  catalog.meta.counts.clientServices, 'client services,',
  catalog.meta.counts.slots, 'slots,',
  catalog.meta.counts.factories, 'factories',
);
