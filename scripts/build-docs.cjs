#!/usr/bin/env node
/**
 * Generate docs/interface-catalog.md from catalog.json.
 *
 *   node scripts/build-docs.cjs
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));

const DEMO = {
  'host-service:webServer': 'Host 快照路由（/plugin-api-gallery/state）',
  'host-service:agents': 'Settings 页 / 原生右侧栏 tab 的实时快照',
  'host-service:sessions': 'Settings 页 / 原生右侧栏 tab 的实时快照',
  'host-service:workingDirectory': 'Settings 页 / 原生右侧栏 tab 的实时快照',
  'host-service:goals': 'Settings 页 / 原生右侧栏 tab 的实时快照',
  'host-service:schedule': 'Settings 页 / 原生右侧栏 tab 的实时快照',
  'host-service:tools': 'Settings 页 / 原生右侧栏 tab 的实时快照',
  'host-service:webApp': 'Settings 页 / 原生右侧栏 tab 的实时快照',
  'slot:conversation.view': '会话 View 标签栏 tab',
  'slot:conversation.session.header.utilities': '会话右上角按钮',
  'slot:conversation.composer.dock': '输入框下方 chip',
  'slot:conversation.input.left': 'composer 左侧按钮',
  'slot:conversation.input.right': 'composer 右侧按钮',
  'slot:conversation.chat.assistant-actions': 'assistant 消息动作',
  'slot:conversation.chat.turnTail': 'Turn 结束行',
  'slot:sidebar.session.row.leading': 'Session 行前徽标',
  'slot:sidebar.footer.action': '侧栏底部动作',
  'slot:settings.section': 'Settings 整页',
  'slot:settings.general.item': 'General 偏好行',
  'slot:settings.plugins.tab': 'Plugins 设置 tab',
  'slot:shell.overlay': '详情弹层 / Toast',
  'slot:conversation.hero.options': 'New Session Hero 选项',
  'slot:sidebar.panellist.actions': '左侧栏「更多」菜单行（0.2.1-rc.3）',
  'slot:conversation.session.header.views.actions': '会话头部 View「更多」菜单行（0.2.1-rc.3）',
  'slot:sidebar.right.tab.guide.actions': '右侧栏起始页「更多」菜单行（0.2.1-rc.3）',
  'builtin:React': '所有 demo 组件',
  'builtin:ctx': 'slot 注册与 ctx.get',
};

function demoFor(category, name) {
  return DEMO[`${category}:${name}`] ?? '';
}

function sinceText(entry) {
  if (entry === undefined || !entry.since) return '—';
  return entry.sinceBase ? `≤ ${entry.since}` : entry.since;
}

function esc(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function code(text) {
  return `\`${String(text).replace(/`/g, '\\`')}\``;
}

const lines = [];
const push = (...values) => lines.push(...values);

push(
  '# DSH 插件接口目录',
  '',
  `> 扫描自运行的 DSH **${catalog.meta.dshVersion}**（${catalog.meta.scannedAt}），来源：${catalog.meta.source}。`,
  '> 本文件由 `scripts/build-docs.cjs` 从 `catalog.json` 生成；接口会随 DSH 版本变化，写代码前请用 `cordis_inspect_query` 复核。',
  '> **版本列** = 该接口首次出现在 DSH release 的版本（由 `scripts/build-versions.cjs` 从各 release tag 的生成式 inspect 目录计算）；`≤ X` 表示最早追踪版本 X 之前就存在。',
  '',
  '## 统计',
  '',
  '| 类别 | 数量 |',
  '| --- | ---: |',
  `| Host Service | ${catalog.meta.counts.hostServices} |`,
  `| Host Event | ${catalog.meta.counts.hostEvents} |`,
  `| Client Service | ${catalog.meta.counts.clientServices} |`,
  `| Client Event | ${catalog.meta.counts.clientEvents} |`,
  `| Client Builtin | ${catalog.meta.counts.clientBuiltins} |`,
  `| Slot | ${catalog.meta.counts.slots} |`,
  `| Factory | ${catalog.meta.counts.factories} |`,
  `| Theme token | ${catalog.meta.counts.themeTokens} |`,
  '',
  '## 先选型：我想做什么？',
  '',
  '| 需求 | 首选接口 | 说明 |',
  '| --- | --- | --- |',
  '| 加一个按钮 / 页面 / 徽标 / Toast | `ctx.slots.register` | 先选 Slot，再决定组件；不要在 `document.body` 上自绘。 |',
  '| 读会话、工作区、模型、任务状态 | Host/Client Service | 用 `ctx.get("name")` 并判空；需要强依赖才用 `inject`。 |',
  '| 在模型调用工具前后做事 | `tools/pre-execute` / `tools/post-execute` / `tools/execute` | waterfall 必须 `return next()`；只观察用 `tools/result`。 |',
  '| 给模型一个新的能力 | `ctx.tools.register` | 工具 schema + `output.render`；UI 卡片由 Chat 渲染。 |',
  '| 加人工斜杠命令 | `ctx.commands.register` | handler 直接返回文本，不发起模型请求。 |',
  '| 改模型看到的提示词 | `ctx.systemPrompt.section` | 稳定事实用 section；按会话上下文用 `ctx.systemPrompt.context`。 |',
  '| 给 UI 提供 Host 数据 | `ctx.webServer.register` + `fetch` | 持久化 bundle 没有 `host.call`；同源 JSON 路由是官方做法。 |',
  '| 改主题 / 加语言 | `ctx.theme` / `ctx.locale` | 令牌 `--dsw-alias-*`；界面文字走 locale。 |',
  '| 切面板 / 开关侧栏 | `ctx.layout` | `selectPanel` / `toggleSidebar` / `openRightbar`。 |',
  '| 存插件自己的数据 | `ctx.storage` / `ctx.storageDomain` | 不要往 Session 里塞新事件类型。 |',
  '| 定时 / 目标 / 子代理 | `ctx.schedule` / `ctx.goals` / `ctx.subagents` | 都是 Host 服务，注意 Session 绑定。 |',
  '',
  '## 最小插件骨架',
  '',
  '```json',
  '{',
  '  "name": "my-plugin",',
  '  "type": "module",',
  '  "exports": { ".": "./index.js", "./client": "./client.js" },',
  '  "dsh": {',
  '    "bundle": { "patch": "./cordis.patch.yml" },',
  '    "client": { "platform": "web", "immediately": true }',
  '  }',
  '}',
  '```',
  '',
  '```yaml',
  '# cordis.patch.yml',
  '- insert:',
  '    - id: my-plugin',
  "      name: 'my-plugin'",
  '```',
  '',
  '```js',
  '// index.js — Host 半',
  'export const name = "my-plugin";',
  'export const inject = ["webServer"];',
  'export function apply(ctx, config) {',
  '  ctx.effect(() => ctx.webServer.register({',
  '    kind: "prefix",',
  '    path: "/my-plugin",',
  '    handler: (req, res) => { res.end(JSON.stringify({ ok: true })); },',
  '  }));',
  '  ctx.on("tools/pre-execute", (exec, next) => next());',
  '}',
  '```',
  '',
  '```js',
  '// client.js — 浏览器半（无构建、无 JSX）',
  'window.__ModuleLoader__.load({',
  '  id: "my-plugin",',
  '  factory(require) {',
  '    const React = require("react");',
  '    return {',
  '      inject: ["slots"],',
  '      apply(ctx) {',
  '        ctx.slots.inject("main", () => ctx.slots.register(',
  '          { name: "main", key: "my-panel" },',
  '          () => React.createElement("div", null, "Hello"),',
  '        ));',
  '      },',
  '    };',
  '  },',
  '});',
  '```',
  '',
  '## 持久化 bundle vs 动态 cordis 包',
  '',
  '| 能力 | 持久化 bundle（本示例） | 动态 cordis 包（cordis_define） |',
  '| --- | --- | --- |',
  '| Slot / Service / Event | 支持 | 支持 |',
  '| Browser → Host 调用 | `ctx.webServer.register` + `fetch` | `host.call(method, args)` + `harness.handle` |',
  '| 样式 | 包自己插入 `<style>` / React 元素 | `styles.insert(css)` |',
  '| 日志 | `console` | 包标签 `console` |',
  '| 生命周期 | Loader entry / HMR | 运行时 Package / run surface |',
  '',
  '## Host Services',
  '',
  `${catalog.meta.counts.hostServices} 个。部分条目被分布式 Slot demo 或 Settings/右侧栏的 Host 快照读取；没有 Demo 的服务通常需要具体业务上下文或会产生副作用，目录里保留了完整方法签名。`,
  '',
);

for (const service of catalog.host.services) {
  const demo = demoFor('host-service', service.key);
  push(`### ${service.key}`, '', esc(service.description), '', `**首次出现**：${sinceText(service)}`, '', demo ? `**在线 Demo**：${demo}` : '**在线 Demo**：—（只读目录 + 用法片段）', '');
  push('<details><summary>方法签名</summary>', '', '```ts');
  for (const method of service.methods) push(method);
  push('```', '', '</details>', '');
  if (demo) {
    push('```js', `const service = ctx.get('${service.key}');`, 'if (service !== undefined) {', `  // ${service.methods[0] ?? ''}`, '}', '```', '');
  }
}

push('## Host Events', '', `${catalog.meta.counts.hostEvents} 个。\`waterfall\` 必须返回 \`next()\`；\`emit\` 只观察；\`serial\`/parallel 按文档等待。`, '');
push('| 事件 | 版本 | 模式 | 说明 | 在线 Demo |', '| --- | --- | --- | --- | --- |');
for (const event of catalog.host.events) {
  push(`| ${code(event.name)} | ${sinceText(event)} | ${event.mode} | ${esc(event.description)} | ${demoFor('host-event', event.name) || '—'} |`);
}
push('');

push('## Client Services', '', `${catalog.meta.counts.clientServices} 个。客户端服务通过受限 \`ctx.get\` 获取。`, '');
for (const service of catalog.client.services) {
  const demo = demoFor('client-service', service.key);
  push(`### ${service.key}`, '', esc(service.description), '', `**首次出现**：${sinceText(service)}`, '', demo ? `**在线 Demo**：${demo}` : '**在线 Demo**：—', '');
  push('<details><summary>方法签名</summary>', '', '```ts');
  for (const method of service.methods) push(method);
  push('```', '', '</details>', '');
  if (demo) push('```js', `const service = ctx.get('${service.key}');`, 'if (service !== undefined) {', `  // ${service.methods[0] ?? ''}`, '}', '```', '');
}

push('## Client Events', '', `${catalog.meta.counts.clientEvents} 个。`, '');
push('| 事件 | 版本 | 模式 | 说明 | 在线 Demo |', '| --- | --- | --- | --- | --- |');
for (const event of catalog.client.events) {
  push(`| ${code(event.name)} | ${sinceText(event)} | ${event.mode} | ${esc(event.description)} | ${demoFor('client-event', event.name) || '—'} |`);
}
push('');

push('## Client Builtins', '', '动态 Client half 可直接使用的符号。持久化 bundle 只有 `React`（`require("react")`）与浏览器全局；`host`/`styles` 需要动态 cordis 包。', '');
push('| 符号 | 说明 | 在线 Demo |', '| --- | --- | --- |');
for (const builtin of catalog.client.builtins) {
  push(`| ${code(builtin.name)} | ${esc(builtin.description)} | ${demoFor('builtin', builtin.name) || '—'} |`);
}
push('');

push('## Slots', '', `${catalog.meta.counts.slots} 个 Slot、${catalog.meta.counts.factories} 个 Factory。\`replaceRisk: shadows-shipped-ui\` 表示复用内置 id 会替换内置 UI；新 id 通常是增量注册。`, '');
push('| Slot | 版本 | 类型 | 作用域 | 父节点 | 用途 | 在线 Demo |', '| --- | --- | --- | --- | --- | --- | --- |');
for (const slot of catalog.client.slots) {
  if (slot.type !== 'slot') continue;
  push(`| ${code(slot.name)} | ${sinceText(slot)} | ${slot.kind} | ${slot.scope} | ${slot.parent ?? '—'} | ${esc(slot.purpose ?? slot.catalogDescription ?? '')} | ${demoFor('slot', slot.name) || '—'} |`);
}
push('');

push('## Factories', '', 'Factory 是拥有者渲染的子界面，不是插件注册点；通常注册它下面声明的 Slot。', '');
push('| Factory | 版本 | 作用域 | 说明 |', '| --- | --- | --- | --- |');
for (const factory of catalog.client.slots) {
  if (factory.type !== 'factory') continue;
  push(`| ${code(factory.name)} | ${sinceText(factory)} | ${factory.scope} | ${esc(factory.purpose ?? '')} |`);
}
push('');

push('## Theme tokens', '', '全部通过 CSS 变量使用；覆盖时同时给出 light/dark。', '');
push('| 令牌 | 说明 |', '| --- | --- |');
for (const token of catalog.client.themeTokens) {
  push(`| ${code(token.name)} | ${esc(token.description)} |`);
}
push('');

push('## 分布式 Demo 对照',
  '',
  '本轮不是总览页，而是把 demo 放进 Slot 的真实位置；46 个可增量 Slot（15 原有 + 18 A + 10 C + 0.2.1-rc.3 新增 3 个 actions slot）已全部实现，入口标题统一为 `图鉴demo · <slot-key>`。下表只列核心入口，完整 46 项矩阵见 `docs/slot-demos.md`。',
  '',
  '| Slot | demo 落点 | 注册方式 |',
  '| --- | --- | --- |',
  '| `conversation.view` | 会话 View 标签栏 tab | list + 新 id |',
  '| `conversation.session.header.utilities` | 会话右上角按钮 | list + 新 id |',
  '| `sidebarRightTabs.register` + `sidebar.right.pane.tab` | 原生右侧栏 tab | registry + keyed body |',
  '| `conversation.composer.dock` | 输入框下方 chip | list + 新 id |',
  '| `conversation.input.left` | composer 左侧按钮 | list + 新 id |',
  '| `conversation.input.right` | composer 右侧按钮 | list + 新 id |',
  '| `conversation.chat.assistant-actions` | assistant 消息动作 | list + 新 id |',
  '| `conversation.chat.turnTail` | Turn 结束行 | list + 新 id |',
  '| `sidebar.session.row.leading` | Session 行前徽标 | list + 新 id |',
  '| `sidebar.footer.action` | 侧栏底部动作 | list + 新 id |',
  '| `settings.section` | Settings 整页 | list + 新 id |',
  '| `settings.general.item` | General 偏好行 | list + 新 id |',
  '| `settings.plugins.tab` | Plugins 设置 tab | list + 新 id |',
  '| `shell.overlay` | 详情弹层 / Toast | list + 新 id |',
  '| `conversation.hero.options` | New Session Hero 选项 | list + 新 id |',
  '| `sidebar.panellist.actions` | 左侧栏「更多」菜单行 | list + 新 id（0.2.1-rc.3） |',
  '| `conversation.session.header.views.actions` | 会话头部 View「更多」菜单行 | list + 新 id（0.2.1-rc.3） |',
  '| `sidebar.right.tab.guide.actions` | 右侧栏起始页「更多」菜单行 | list + 新 id（0.2.1-rc.3） |',
  '',
  '小入口（header、input、session row、footer）用紧凑标签 + 完整 `title`/`aria-label`；tab/页面/列表项直接显示完整 `图鉴demo · <slot>`。所有小入口的详情由 `shell.overlay` 弹层展示。',
  '',
  '## 重新扫描',
  '',
  '在 DSH 会话里让 Agent 调用：',
  '',
  '```text',
  'cordis_inspect_list',
  'cordis_inspect_query { platform: "host", provider: "Service" }',
  'cordis_inspect_query { platform: "host", provider: "Event" }',
  'cordis_inspect_query { platform: "client", provider: "Slots" }',
  'cordis_inspect_query { platform: "client", provider: "Theme" }',
  '```',
  '',
  '把结果写回 `.scan/`，然后：',
  '',
  '```sh',
  'node scripts/build-versions.cjs',
  'node scripts/build-catalog.cjs',
  'node scripts/build-docs.cjs',
  'node scripts/build-interfaces.cjs',
  'node scripts/build-non-ui.cjs',
  '```',
  '',
  '## 已知边界',
  '',
  '- 目录是静态快照；运行时 `ctx.get("service")` 可能返回 `undefined`，必须判空。',
  '- 46 个可增量 Slot（15 原有 + 18 A + 10 C + rc.3 新增 3）已全部实现；B 类 57 + Factory 6 属于不可增量/不可见，不注册。',
  '- Inspect 的 Client Service 目录是 “catalogued” 子集：`ctx.commandUi`（ui-commands）、`ctx.sidebarRight` / `ctx.sidebarRightTabs`（ui-sidebar-right）等服务不在快照里，但包内确实提供；本项目直接消费了它们。',
  '- 不是每个 Slot 都适合直接塞 demo：`main`、`sidebar`、`rightbar.session` 等 single/replace 型 Slot 会替换内置 UI，本示例不占用。',
  '- 原生右侧栏的 tab 列表是 registry，不是 Slot；`sidebar.right.pane.tab` 只渲染 body。加列表项必须用 `ctx.sidebarRightTabs.register`。',
  '- `settings.section` / `settings.general.item` / `settings.plugins.tab` / `conversation.hero.options` 只在对应界面挂载时由 `slots.inject` 注册；这是预期行为。',
  '- 本示例没有声明 `Config` schema（需要 `@deepseek-ai/schemastery`），所以插件详情没有配置表单；`apply` 仍会收到 patch 行里的 `config` 对象。',
  '- UI 视觉验证受当前环境限制：已确认 15 个 Slot occupant、原生右侧栏 body、Host 路由、HMR 加载；具体像素表现请在 Web UI 中查看。',
  '',
);

const target = path.join(ROOT, 'docs', 'interface-catalog.md');
fs.writeFileSync(target, lines.join('\n'));
console.log('docs/interface-catalog.md:', lines.length, 'lines');
