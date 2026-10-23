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
const slots = catalog.client.slots;

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

const buckets = Object.fromEntries(groups.map((group) => [group.id, []]));

for (const slot of slots) {
  const group = groupOf(slot);
  if (group === null) continue;
  const reason = NOTES[slot.name] ?? groups.find((entry) => entry.id === group).reason;
  buckets[group].push({
    name: slot.name,
    type: slot.type,
    kind: slot.kind ?? 'factory',
    scope: slot.scope,
    parent: slot.parent ?? null,
    purpose: slot.purpose ?? '',
    replaceRisk: slot.replaceRisk ?? null,
    registration: slot.registration ?? [],
    keyDomain: slot.keyDomain ?? null,
    allowedKeys: slot.allowedKeys ?? null,
    reason,
  });
}

const counts = Object.fromEntries(groups.map((group) => [group.id, buckets[group.id].length]));
const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

const output = {
  generatedAt: '2026-10-23',
  dshVersion: catalog.meta.dshVersion,
  counts,
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
