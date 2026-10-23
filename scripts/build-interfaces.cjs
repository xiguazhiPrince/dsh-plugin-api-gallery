#!/usr/bin/env node
/**
 * Generate interfaces-reference.json: the non-UI half of the interface
 * catalogue (Events, Services, Client Builtins) rendered on the page opened
 * from sidebar.panellist.
 *
 *   node scripts/build-interfaces.cjs
 *
 * Input: catalog.json (Inspect snapshot) + the four source-verified client
 * services that the Inspect Service catalogue does not list.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));

const HOST_USED = new Set([
  'webServer', 'tools', 'commands', 'agents', 'sessions', 'workingDirectory', 'goals', 'schedule', 'webApp',
]);
const CLIENT_USED = new Set(['slots', 'sidebarRightTabs', 'sidebarRight', 'commandUi']);

const EXTRA_CLIENT_SERVICES = [
  {
    key: 'sidebarRight',
    description: '原生右侧栏导航 controller：打开/关闭 tab、按 target 打开、tabDomain 与命令目标解析。',
    methods: ['openTab(kind, options?)', 'close(tabId)', 'openTabs.getSnapshot()', 'tabDomain.occurrence(sessionId, { id })'],
    used: CLIENT_USED.has('sidebarRight'),
  },
  {
    key: 'sidebarRightTabs',
    description: '原生右侧栏 tab 类型 registry：注册 { id, kind, title, guide, priority }，body 由 sidebar.right.pane.tab 渲染。',
    methods: ['register(definition): () => void'],
    used: CLIENT_USED.has('sidebarRightTabs'),
  },
  {
    key: 'commandUi',
    description: 'composer + 菜单与 / 菜单的客户端命令 registry：注册 popupSelect 或 action contribution。',
    methods: ['register(contribution): () => void', 'decorate(decoration): () => void', 'dismiss(name)'],
    used: CLIENT_USED.has('commandUi'),
  },
  {
    key: 'inputTriggers',
    description: '输入触发源 registry：/ 与 @ 的候选源、pick/claim/header 路由。',
    methods: ['registerSource(source): () => void'],
    used: false,
  },
];

function observeSnippet(event) {
  if (event.mode === 'waterfall') {
    return `ctx.on('${event.name}', (payload, next) => {\n  // inspect or rewrite payload\n  return next();\n})`;
  }
  return `ctx.on('${event.name}', (payload) => {\n  // observe only\n})`;
}

function useSnippet(scope, key) {
  return scope === 'host'
    ? `const service = ctx.get('${key}');\nif (service !== undefined) {\n  // service.<method>\n}`
    : `const service = ctx.get('${key}');\nif (service !== undefined) {\n  // service.<method>\n}`;
}

function events(list) {
  return list.map((event) => ({
    name: event.name,
    mode: event.mode,
    description: event.description,
    signature: event.signature,
    observe: observeSnippet(event),
  }));
}

function services(list, scope, usedSet) {
  return list.map((service) => ({
    key: service.key,
    description: service.description,
    methods: service.methods,
    used: usedSet.has(service.key),
    use: useSnippet(scope, service.key),
  }));
}

const output = {
  generatedAt: '2026-10-23',
  dshVersion: catalog.meta.dshVersion,
  counts: {
    hostEvents: catalog.host.events.length,
    clientEvents: catalog.client.events.length,
    hostServices: catalog.host.services.length,
    clientServices: catalog.client.services.length,
    extraClientServices: EXTRA_CLIENT_SERVICES.length,
    clientBuiltins: catalog.client.builtins.length,
    themeTokens: catalog.client.themeTokens.length,
  },
  events: {
    host: events(catalog.host.events),
    client: events(catalog.client.events),
  },
  services: {
    host: services(catalog.host.services, 'host', HOST_USED),
    client: services(catalog.client.services, 'client', CLIENT_USED),
    extraClient: EXTRA_CLIENT_SERVICES,
  },
  builtins: catalog.client.builtins.map((builtin) => ({
    name: builtin.name,
    description: builtin.description,
    signatures: builtin.signatures,
  })),
  themeTokens: catalog.client.themeTokens.map((token) => ({
    name: token.name,
    description: token.description,
    valueType: token.valueType,
  })),
};

const target = path.join(ROOT, 'interfaces-reference.json');
fs.writeFileSync(target, JSON.stringify(output, null, 2) + '\n');
console.log(
  'interfaces-reference.json:',
  output.counts.hostEvents, 'host events,', output.counts.clientEvents, 'client events,',
  output.counts.hostServices, 'host services,', output.counts.clientServices, 'client services,',
  output.counts.extraClientServices, 'extra client services,',
  output.counts.clientBuiltins, 'builtins',
);
