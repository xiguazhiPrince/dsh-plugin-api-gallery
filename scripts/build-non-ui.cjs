#!/usr/bin/env node
/**
 * Generate non-ui-slots.json: the 57 Slot that cannot be additive visible UI
 * plus the 6 Factory, with the concrete reason for each group.
 *
 *   node scripts/build-non-ui.cjs
 *
 * Input: catalog.json (the Inspect snapshot).
 * Output: non-ui-slots.json, served by the Host at
 *         GET /plugin-api-gallery/non-ui and rendered on the
 *         `图鉴demo · main` page opened from sidebar.panellist.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
const VERSIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'version-since.json'), 'utf8'));
const slots = catalog.client.slots;

function sinceOf(slot) {
  const entry = slot.type === 'factory' ? VERSIONS.factories[slot.name] : VERSIONS.slots[slot.name];
  if (!entry) return {};
  return entry.base ? { since: entry.since, sinceBase: true } : { since: entry.since };
}

const OWNER_DISPATCH = [
  'settings.models.provider-card',
  'plugins.bundle.config',
  'plugins.bundle.activation',
  'plugins.row.config',
  'sidebar.right.tab.document',
  'sidebar.right.tab.document.office.pdf',
  'sidebar.right.tab.document.action',
];

const NOTES = {
  'root': 'shell 唯一渲染的树根；替换它会换掉整个应用渲染树。',
  'sidebar': '整个左列只有一个节点，注册即替换内置侧栏。',
  'sidebar.brand.mark': '品牌标记唯一节点。',
  'sidebar.brand.name': '品牌名唯一节点。',
  'sidebar.toggle.badge': '折叠侧栏展开按钮内的唯一徽标。',
  'sidebar.settings': '侧栏底部 Settings 唯一座位。',
  'settings.trigger': '侧栏底部设置触发行唯一内容。',
  'settings.header': '设置面板标题唯一文本位。',
  'settings.close': '关闭按钮的视觉隐藏标签唯一节点。',
  'settings.launcher': '侧栏账号启动器唯一节点。',
  'settings.models.sign-in': '账号登录选择唯一节点。',
  'main': '中央主面板是单 keyed 座位；本插件已用 fresh key 演示（见 main 页面）。',
  'rightbar': '右列唯一节点。',
  'rightbar.session': '右列 Session 内容唯一节点。',
  'sidebar.chat.conversation': '右栏 chat tab 的 Conversation 承载唯一节点。',
  'conversation.chat.flow': 'Chat 行流唯一节点，注册即替换整个消息流。',
  'conversation.chat.reasoning.body': 'reasoning 正文唯一渲染器。',
  'conversation.chat.reasoning.content': 'reasoning 内容 Factory 由 owner 渲染。',
  'conversation.chat.user.content': '用户消息内容 Factory 由 owner 渲染。',
  'conversation.chat.user.images': '用户图片唯一渲染器。',
  'conversation.user.text.node': 'UserTextId 键表固定（command/file/folder/secret/session/skill/text），新 key 不被派发。',
  'conversation.chat.node': 'ChatNodeKind 键表固定 19 种；新 key 不被派发。',
  'workspace.toast': 'ToastKind 键表固定 11 个 key；新 key 不存在。',
  'tool.view.cordis': '动态 Client Guard 只允许 self，key 绑定 pluginId/packageId。',
  'tool.call.images': '含图 Tool call 的持久图片渲染器唯一节点。',
  'settings.models.provider-card': 'key = settingsNs，只有模型 provider 卡会派发。',
  'plugins.bundle.config': 'key = bundle 包名，只在该 bundle 自己的 page view 派发。',
  'plugins.bundle.activation': 'key = npm 包名，只在用户从列表启用某 bundle 后派发。',
  'plugins.row.config': 'key = bundle patch 的 <包名>#<row id>，插件不声明该行就没有 key。',
  'sidebar.right.tab.document': 'key = 已注册 document 实现 id，由 document registry 派发。',
  'sidebar.right.tab.document.office.pdf': 'key = Office 转换字节专用路径。',
  'sidebar.right.tab.document.action': 'key = document renderer 专属，只有对应 renderer 才能命中。',
  'shell.quota-notice': 'selector 命中即替换内置配额提示链。',
  'sidebar.right.tab.guide': 'guide tab body 的 selector 路由替换。',
  'conversation.composer': 'selector 命中即替换整个 composer。',
};

function groupOf(slot) {
  if (slot.type === 'factory') return 'factory';
  if (slot.kind === 'single') return 'single';
  if (slot.kind === 'chain') return 'chain';
  if (slot.kind === 'keyed') {
    if (slot.allowedKeys || String(slot.keyDomain ?? '').toLowerCase().includes('fixed')) return 'fixed';
    if (OWNER_DISPATCH.includes(slot.name)) return 'owner';
  }
  return null;
}

const groups = [
  {
    id: 'single',
    title: 'single（43）',
    reason: 'single Slot 由 owner 直接渲染唯一节点；注册即替换内置 UI，不是追加入口。',
  },
  {
    id: 'chain',
    title: 'chain（3）',
    reason: 'chain Slot 用 select(owner) 路由替换，不是追加；命中会换掉内置内容。',
  },
  {
    id: 'fixed',
    title: 'fixed-key keyed（4）',
    reason: 'keyed 但 keyDomain 是 owner 固定的键表；新 key 不存在，注册也不会渲染。',
  },
  {
    id: 'owner',
    title: 'owner-dispatch-only keyed（7）',
    reason: 'keyDomain 是 open，但 key 由 owner 自己的注册表派发；插件注册 fresh key 永远不会被 dispatch。',
  },
  {
    id: 'factory',
    title: 'Factory（6）',
    reason: 'Factory 是 owner 直接渲染的子界面，不是插件注册席位；没有 register API。',
  },
];

/** Coarse UI regions used by the page's layout map. */
const REGIONS = [
  { id: 'frame', title: '框架 / Chrome', where: '整个应用外框：根渲染树、左上角 chrome、三列下方通栏。' },
  { id: 'sidebar', title: '左栏 / 侧栏', where: '整个左列：品牌行、折叠徽标、侧栏底部 Settings 触发位。' },
  { id: 'sessions', title: '左栏 / 会话列表', where: '侧栏 Workspace / Session 浏览区：行前装饰、行尾按钮、“...” 菜单。' },
  { id: 'settings', title: 'Settings 面板', where: '侧栏底部 Settings 打开的面板：标题、关闭、General、Plugins tab、Models、onboarding。' },
  { id: 'main', title: '中央主面板', where: '三列中间的主面板：Conversation 外壳或 Plugins / Schedules 等面板。' },
  { id: 'header', title: '会话 Header', where: '会话标题行：标题、面包屑、右上角工具区、View 标签栏。' },
  { id: 'chat', title: '聊天正文', where: '消息流：Chat rows、reasoning、Tool call 卡、用户文本/图片、Turn 尾部。' },
  { id: 'composer', title: '输入框 / Composer', where: '底部输入区：composer 卡、工具行左右、附件、浮层菜单、plan review。' },
  { id: 'hero', title: 'New Session Hero', where: '空白新会话的中央 Hero：workspace / preset / brand / options。' },
  { id: 'rightbar', title: '原生右侧栏', where: '右侧栏：文件、终端、文档预览、Plan、Schedule、chat 等 tab 及其工具栏/菜单。' },
  { id: 'overlay', title: '全屏浮层', where: '所有列之上、滚动容器之外的 frame-wide 层：Toast、quota notice、详情弹层。' },
  { id: 'plugins', title: 'Plugins 页面', where: '中央主面板的 Plugins 页面：Official 列表、bundle/row 详情、配置区、add 菜单。' },
];

const REGION_LABEL = Object.fromEntries(REGIONS.map((region) => [region.id, region.title]));

function regionOfName(name) {
  if (name === 'root' || name === 'shell.leading' || name === 'shell.bottom') return 'frame';
  if (name === 'shell.overlay' || name === 'shell.quota-notice' || name === 'workspace.toast' || name === 'workspace.toast.content') return 'overlay';
  if (name.startsWith('plugins.')) return 'plugins';
  if (name.startsWith('settings.models') || name.startsWith('settings.')) return 'settings';
  if (name === 'sidebar.settings' || name.startsWith('sidebar.brand') || name === 'sidebar.toggle.badge' || name === 'sidebar' || name === 'settings.launcher' || name === 'settings.trigger') return 'sidebar';
  if (name.startsWith('sidebar.workspaces') || name.startsWith('sidebar.session.row.')) return 'sessions';
  if (name.startsWith('sidebar.right') || name.startsWith('rightbar') || name === 'sidebar.chat.conversation') return 'rightbar';
  if (name.startsWith('conversation.hero')) return 'hero';
  if (name === 'conversation.header' || name.startsWith('conversation.session.header')) return 'header';
  if (name === 'conversation.composer' || name.startsWith('conversation.composer.') || name.startsWith('conversation.input.')) return 'composer';
  if (name.startsWith('conversation.chat') || name.startsWith('tool.') || name.startsWith('conversation.user.text') || name === 'conversation.images.content') return 'chat';
  if (name === 'main' || name === 'main.conversation' || name === 'conversation.content') return 'main';
  return null;
}

function regionFor(slot) {
  const direct = regionOfName(slot.name);
  if (direct !== null) return direct;
  const parent = slot.parent ? slotsByName.get(slot.parent) : undefined;
  if (parent !== undefined) {
    const inherited = regionFor(parent);
    if (inherited !== null) return inherited;
  }
  return 'main';
}

const slotsByName = new Map(slots.map((slot) => [slot.name, slot]));

function breadcrumbOf(name) {
  const parts = [];
  let current = slotsByName.get(name);
  while (current !== undefined) {
    parts.unshift(current.name);
    current = current.parent ? slotsByName.get(current.parent) : undefined;
  }
  return parts.join(' › ');
}

const buckets = Object.fromEntries(groups.map((group) => [group.id, []]));

for (const slot of slots) {
  const group = groupOf(slot);
  if (group === null) continue;
  const reason = NOTES[slot.name] ?? groups.find((entry) => entry.id === group).reason;
  const region = regionFor(slot);
  buckets[group].push({
    name: slot.name,
    type: slot.type,
    kind: slot.kind ?? 'factory',
    scope: slot.scope,
    parent: slot.parent ?? null,
    breadcrumb: breadcrumbOf(slot.name),
    region,
    regionLabel: REGION_LABEL[region],
    purpose: slot.purpose ?? '',
    replaceRisk: slot.replaceRisk ?? null,
    registration: slot.registration ?? [],
    keyDomain: slot.keyDomain ?? null,
    allowedKeys: slot.allowedKeys ?? null,
    reason,
    ...sinceOf(slot),
  });
}

const counts = Object.fromEntries(groups.map((group) => [group.id, buckets[group.id].length]));
const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
const regionCounts = {};
for (const region of REGIONS) {
  const count = buckets.single.concat(buckets.chain, buckets.fixed, buckets.owner, buckets.factory)
    .filter((item) => item.region === region.id).length;
  regionCounts[region.id] = count;
}

// Slots introduced by the current DSH release that are additive (so they are
// demoed in place, not listed in the non-UI buckets above). The page shows this
// strip so readers can see "new in this version" and the version badge.
const newSlots = slots
  .filter((slot) => slot.type === 'slot' && slot.since === catalog.meta.dshVersion && slot.sinceBase !== true)
  .map((slot) => ({
    name: slot.name,
    kind: slot.kind ?? null,
    scope: slot.scope ?? null,
    parent: slot.parent ?? null,
    since: slot.since,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const output = {
  generatedAt: catalog.meta.scannedAt,
  dshVersion: catalog.meta.dshVersion,
  versionSource: catalog.meta.versionSource,
  newSlots,
  counts,
  regionCounts,
  regions: REGIONS.map((region) => ({ ...region, count: regionCounts[region.id] })),
  total,
  groups: groups.map((group) => ({
    ...group,
    count: buckets[group.id].length,
    items: buckets[group.id].sort((a, b) => a.name.localeCompare(b.name)),
  })),
};

const target = path.join(ROOT, 'non-ui-slots.json');
fs.writeFileSync(target, JSON.stringify(output, null, 2) + '\n');
console.log(
  'non-ui-slots.json:',
  counts.single, 'single,', counts.chain, 'chain,', counts.fixed, 'fixed,',
  counts.owner, 'owner-dispatch,', counts.factory, 'factory =', total,
);

if (counts.single !== 43 || counts.chain !== 3 || counts.fixed !== 4 || counts.owner !== 7 || counts.factory !== 6) {
  console.error('unexpected counts; expected 43/3/4/7/6');
  process.exitCode = 1;
}
