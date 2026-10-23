# Slot Demo 的契约与落点（15 保留 + 24 新增 + 4 最后补齐 = 43）

本文件记录 `dsh-plugin-api-gallery` 实际占用的 **43 个 Slot 注册**：15 个既有 Slot（保留、回归基线）+ **A-新增 18** + **C 子集 10**。内容包括 kind/scope、owner props、注册方式、出现在哪里，以及原生右侧栏的两段式注册。

> 接口来自 DSH **0.2.1-rc.2** 的 `cordis_inspect_query` 与 `@deepseek-ai/dsh-client-ui-sidebar-right` 的 shipped source/README。命名约定：入口标题 `图鉴demo · <slot-key>`；空间小的按钮用短标签 + 完整 `title`/`aria-label`，详情弹层标题始终是完整名。
>
> 最终 live `client / Slots / listSubTree` 已恢复，43 个注册逐项抽查 occupant 均为 active（详见文末验证）。没有浏览器控制入口，所以仍未做像素级截图。

---

## 15 个保留 Slot 矩阵

| # | Slot | kind / scope | owner props | 本插件注册 id | 出现在哪里 |
| --- | --- | --- | --- | --- | --- |
| 1 | `conversation.view` | list / session | `inspectCall`, `viewRequest`, `openView`, `completeViewRequest` | `api-gallery-view` | 会话顶部 View 标签栏（Chat / Trajectory 旁） |
| 2 | `conversation.session.header.utilities` | list / session | 无（标准 props） | `api-gallery-header` | 会话右上角工具区 |
| 3 | `sidebarRightTabs.register` + `sidebar.right.pane.tab` | tab type registry + keyed body / session | body 通过 `useTabInfo()` 读 `{ sidebar, panel, tab }` | `api-gallery:right-tab`（kind `api-gallery-demo`） | 原生右侧栏 tab 列表 / body |
| 4 | `conversation.composer.dock` | list / session | 无（标准 props） | `api-gallery-dock` | 输入框下方 |
| 5 | `conversation.input.left` | list / session | 无（标准 props） | `api-gallery-input-left` | composer 工具行左侧 |
| 6 | `conversation.input.right` | list / session | 无（标准 props） | `api-gallery-input-right` | 提交按钮前 |
| 7 | `conversation.chat.assistant-actions` | list / session | `{ messageId }` | `api-gallery-assistant` | 每条 finalized assistant 消息旁 |
| 8 | `conversation.chat.turnTail` | list / session | `{ turn, seq, openFile }` | `api-gallery-turn-tail` | 完成 Turn 的 action row 之前 |
| 9 | `sidebar.session.row.leading` | list / root | `{ sessionId }` | `api-gallery-session-row` | idle Session 行最前面的 16px 槽位 |
| 10 | `sidebar.footer.action` | list / root | `{ wide }` | `api-gallery-footer` | 侧栏底部 Settings 旁 |
| 11 | `settings.section` | list / root | `{ close }` | `api-gallery-settings` | Settings 左侧导航整页 |
| 12 | `settings.general.item` | list / root | 无（`{}`） | `api-gallery-general` | Settings → General 偏好行 |
| 13 | `settings.plugins.tab` | list / root | 无（`{}`） | `api-gallery-plugins-tab` | Settings → Plugins tab |
| 14 | `shell.overlay` | list / root | 无（标准 props） | `api-gallery-overlay` | 全屏浮层（详情弹层 + Toast） |
| 15 | `conversation.hero.options` | list / session | 无（标准 props） | `api-gallery-hero` | New Session Hero 右侧选项 |

**最终确认 active 的 occupant**：上表 1–15 的 id 全部出现在对应 Slot 的 occupants 中；原生右侧栏的 body key `api-gallery:right-tab` 也 active。`main` / `sidebar.panellist` 现在分别由 `api-gallery-panel` 占用（成对实现，不是旧总览页）。

---

## A-新增 18 矩阵

15 个由 `GENERIC_SLOTS` + `GalleryEntry` 通用组件渲染（点击统一 `openSlotDetail(slot, h(GenericSlotExtra, { entry }))`），3 个 bespoke。owner props 一律未知 → 只按 undefined 防御，不调用 `openFile`。

| # | Slot | kind / scope | mode | 本插件 id / key | order | 出现在哪里 | 状态 |
| --- | --- | --- | --- | --- | ---: | --- | --- |
| A1 | `settings.models.footer` | list / root | row | `api-gallery-models-footer` | 50 | Settings → Models provider 行之后 | active |
| A2 | `settings.action` | list / root | button | `api-gallery-settings-action` | 50 | 设置内容列 header（Close 前） | active |
| A3 | `sidebar.workspaces.session.menu.item` | list / root | menu-item | `api-gallery-session-menu` | 60 | Session “...” 菜单 | active |
| A4 | `sidebar.workspaces.session.row.action` | list / root | icon-button | `api-gallery-session-row-action` | 60 | Session 行 hover 末尾 | active |
| A5 | `sidebar.session.row.hover` | list / root | row | `api-gallery-session-hover` | 50 | Session hover 卡 | active |
| A6 | `plugins.tab` | list / root | tab | `api-gallery-plugins-page-tab` | 60 | Settings → Plugins 页 tab | active |
| A7 | `plugins.item` | list / root | row | `api-gallery-plugin-item` | 60 | Plugins Official 列表 | active |
| A8 | `plugins.detail.actions` | list / root | button | `api-gallery-detail-actions` | 50 | Plugins 详情页 header | active |
| A9 | `plugins.detail.badge` | list / root | badge | `api-gallery-detail-badge` | 50 | Plugins 详情页标题旁 | active |
| A10 | `plugins.detail.section` | list / root | inline-panel | `api-gallery-detail-section` | 50 | Plugins 详情页下方 | active |
| A11 | `conversation.session.header.actions` | list / session | button | `api-gallery-header-actions` | 50 | 会话标题旁 | active |
| A12 | `sidebar.right.tab.files.actions` | list / session | icon-button | `api-gallery-files-actions` | 50 | 右栏 Files tab 工具栏 | active |
| A13 | `sidebar.right.tab.document.actions` | list / session | button | `api-gallery-document-actions` | 50 | 右栏文档预览工具栏 | active |
| A14 | `sidebar.right.tab.menu.item` | list / session | menu-item | `api-gallery-right-menu` | 60 | 右栏 tab “...” 菜单 | active |
| A15 | `sidebar.right.pane.tab.title` | keyed / session | chip | key `api-gallery:right-tab` | — | 图鉴右栏 tab 标题 | active |
| A16 | `deliverables.file.actions` | list / session | link | `api-gallery-file-actions` | 50 | Turn 尾行动作 | active |
| A17 | `conversation.input.overlay` | list / session | chip | `api-gallery-input-overlay` | 50 | composer 卡内 | active |
| A18 | `conversation.input.dock` | list / session | row | `api-gallery-input-dock` | 50 | composer 卡上方 | active |

## 安全 C 子集 6

| # | Slot | kind / scope | mode | id / key | 出现条件 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| C3 | `settings.onboarding` | list / root | inline | `api-gallery-onboarding` | onboarding 流程挂载 | active |
| C4 | `plugins.add.actions` | list / root | row | `api-gallery-plugins-add-actions` | bundle 安装完成 | active |
| C5 | `sidebar.right.tab.document.unpreviewable` | list / session | row | `api-gallery-document-unpreviewable` | 文件不可预览空态 | active |
| C6 | `deliverables.review.file.actions` | list / session | link | `api-gallery-review-file-actions` | changed-file review tab | active |
| C7 | `conversation.plan-review.actions` | list / session | button | `api-gallery-plan-review-actions` | plan 正在 review | active |
| C8 | `sidebar.right.tab.guide.entry` | keyed / session | guide-card | key `api-gallery:right-tab` | guide 卡渲染 | active |

> **key 名修正**：任务文本写 `conversation.composer.plan-review.actions`，但 `docs/all-slots.md` §2.8 / `docs/slot-classification.md` C7 的实时 key 是 `conversation.plan-review.actions`；代码按 census 的真实 key 注册。
>
> **A15 / C8 的 key 安全性**：两者都使用 `sidebarRightTabs.register` 已创建的自家 type id `api-gallery:right-tab`，因此只可能替换本插件自己的 chip 标题 / fallback guide 卡，不触碰内置 tab。

## C 最后 4（main/panellist + 2 个 keyed chat 视图）

| # | Slot | kind / scope | mode | id / key | 出现条件 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | `main` | keyed / root | page | key `api-gallery-panel` | 点击 sidebar.panellist 图鉴demo 图标 | active |
| C2 | `sidebar.panellist` | list / root | icon | `api-gallery-panel` | 侧栏全局面板图标区 | active |
| C9 | `tool.call.toolview` | keyed / session | tool-card | key `api_gallery_demo` | 模型调用 Host 工具 `api_gallery_demo` | active |
| C10 | `conversation.chat.commandview` | keyed / session | command-row | key `api-gallery` | 输入 Host 命令 `/api-gallery` | active |

> C1/C2 的 id/key 必须相同（`api-gallery-panel`），否则侧栏图标会打开空面板；C9/C10 的 key 必须与 Host 半注册的工具/命令名完全一致。Host 半现在注册 `api_gallery_demo` 与 `/api-gallery` 专门服务这两个 keyed Slot。

## 通用 GalleryEntry 注册

20 个 list 项（15 A + 5 C）共用同一段注册逻辑：

```js
for (const entry of GENERIC_SLOTS) {
  ctx.slots.inject(entry.slot, () => ctx.slots.register({
    name: entry.slot,
    id: entry.id,                 // api-gallery-<slug>，全系统唯一
    order: entry.order,
    label: () => slotTitle(entry.slot),
  }, (props) => h(GalleryEntry, { ...props, entry })));
}
```

- `GalleryEntry` 只读注入的 `entry`，**忽略全部 owner props**；所以未知上下文的 props 不可能抛错，也不会触发 `openFile` 等副作用。
- mode → DOM：`button`/`row`/`inline` 行布局、`icon-button` 24px「图」、`menu-item` role=menuitem 行、`badge`/`chip` 胶囊、`link` 文本按钮。
- 点击统一 `openSlotDetail(slot, h(GenericSlotExtra, { entry }))` → 现有 `shell.overlay` 详情弹层（desc + 注册代码），没有 per-entry 私有弹层。

## Bespoke 4 项（24 新增中的特殊形态）

| Slot | 组件 | 实现要点 |
| --- | --- | --- |
| `plugins.tab` | `PluginsTabDemo` | 复用 `SlotPage`：标题、desc、注册代码、Host 快照；不是主面板 |
| `plugins.detail.section` | `PluginsDetailSectionDemo` | 内联 `<section>` + `CodeBlock`；不读取详情页 subject |
| `sidebar.right.pane.tab.title` | `PaneTabTitleDemo` | 返回 chip 节点；`props.useTabInfo()` 仅在存在时 try/catch 调用，抛错也不影响标题 |
| `sidebar.right.tab.guide.entry` | `GuideEntryDemo` | `span role=button`（避免嵌进 owner 按钮）；点击开共享详情弹层 |

## 仍未实现（B 类 + Factory，不可增量 / 不可见）

| Slot / 类别 | 数量 | 原因 |
| --- | ---: | --- |
| B 类 single / chain / fixed-key / owner-dispatch | 43 + 3 + 4 + 7 | 注册即替换内置 UI、selector 路由替换、key 集合固定或永不派发；详见 `docs/slot-classification.md` §3 |
| Factory | 6 | 由 owner 直接渲染的子界面，不是注册点 |

> 43 个可增量 Slot（15 原有 + 18 A + 10 C）已全部注册；`main`、`sidebar.panellist`、`tool.call.toolview`、`conversation.chat.commandview` 也已在最后补齐。剩余 B 类 57 + Factory 6 不注册。


---

## 不可见 Slot / Factory 参考页

`main` + `sidebar.panellist` 这一对现在承载的是“不可见 Slot 参考页”：

- 数据：`non-ui-slots.json`，由 `node scripts/build-non-ui.cjs` 从 `catalog.json` 生成；
- Host：`GET /plugin-api-gallery/non-ui`（只读 JSON，缓存 60s）；
- 页面：侧栏 3×3 图标 → `main` 页面，分组展示 `single 43 / chain 3 / fixed-key 4 / owner-dispatch 7 / Factory 6`，共 63 项；
- 页面顶部有 **UI 位置示意图**（左栏 / 中央 / 右侧 + frame / overlay）：每个区域带该区域不可见项数量，点击过滤，再点取消；
- 每行折叠显示 slot 名 + 区域标签 + kind/scope + 简短原因；展开显示 region 说明、breadcrumb（`root › … › slot`）、purpose、parent、replaceRisk、keyDomain、registration、原因；
- 顶部搜索按 slot 名 / 用途 / 原因过滤；
- 页面底部可展开 `main` + `sidebar.panellist` 注册代码和 Host 快照。

> UI 位置示意图是**概念布局**，不是像素级截图；精确位置仍需对照实际界面。数据里的 `regionCounts` / `regions` 是页面地图的来源，`breadcrumb` 由 `parent` 链生成。

> 这一页只收录 57 个不可见 Slot + 6 Factory；43 个可交互 Slot 仍在各自位置，不在这页重复。`/non-ui` 已 live 验证：200、total 63、counts 43/3/4/7/6。

## 通用注册方式

除原生右侧栏外，全部是：

```js
ctx.slots.inject('<slot>', () => ctx.slots.register({
  name: '<slot>',
  id: '<unique-id>',       // list Slot
  key: '<unique-key>',     // keyed Slot 才用 key
  order: 50,
  label: () => '图鉴demo · <slot>', // 部分 Slot 不投影 label
}, Demo))
```

- `settings.general.item` 不投影 `label`，行自己画标题；本插件仍传了 `id/order`，没传 `label`。
- `shell.overlay` 不投影 `label`。
- `sidebar.session.row.leading` 的徽标只在 idle 行显示；busy / pending 状态会被状态点替换，这是 Slot 自身的规则。
- `conversation.chat.turnTail` 只在 finalized Turn 渲染。
- `conversation.view` 的 tablist 需要至少 2 个 view；本插件是第 3 个（Chat + Trajectory + demo），所以 tablist 一定显示。
- `settings.section` / `settings.general.item` / `settings.plugins.tab` / `conversation.hero.options` 只在对应界面挂载时由 `slots.inject` 注册；上一轮已确认全部 active（本轮 Inspect 超时，未重读）。

---

## 原生右侧栏：两段式注册（不是 better-sidebar）

本插件使用 DSH 自带 `@deepseek-ai/dsh-client-ui-sidebar-right` 的服务。

### 1. 类型（tab 列表项）

```js
const tabs = ctx.get('sidebarRightTabs');
if (tabs !== undefined) {
  ctx.effect(() => tabs.register({
    id: 'api-gallery:right-tab',
    kind: 'api-gallery-demo',
    priority: 'extension',            // 'extension' | 'builtin' | 'fallback'
    title: () => '图鉴demo · sidebarRightTabs.register',
    guide: [{
      id: 'demo',
      order: 100,
      title: () => '图鉴demo',
      description: () => '原生右侧栏 tab：sidebarRightTabs.register + sidebar.right.pane.tab',
      // icon?: ReactNode | ((size: number) => ReactNode)
    }],
    // patterns? / canOpen? / keepMounted? / multiple? 按需
  }), 'api-gallery: native right tab type');
}
```

要点：

- `id` 是类型身份，也是后面 body 的 key；全系统唯一。`kind` 必须唯一（一个 kind 最多一个 extension + 一个 builtin）。
- `title` 是函数，**打开时捕获**成 chip 文本；本轮额外注册了 `sidebar.right.pane.tab.title`（同一 key）来接管自家 tab 的 chip 标题。
- `description` / `icon` 只存在于 **guide entry**，不在 type descriptor 上。
- `guide` entry 的 `id` 在 provider 内唯一；不写 `icon` 时使用 guide 的默认 cube 占位。
- `multiple: true` 用于 terminal 这种多实例；本示例单 tab，不传。

### 2. body（tab 内容）

```js
ctx.slots.inject('sidebar.right.pane.tab', () =>
  ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: 'api-gallery:right-tab',   // = definition.id
  }, RightSidebarTabDemo));
```

body 组件从 props 拿 `useTabInfo`（framework-injected hook），调用后得到：

```js
const { sidebar, panel, tab } = useTabInfo();
// sidebar: expansion / fullscreen 信息
// panel:   { id }
// tab:     { id, kind, visible, navigation, signal, actions, ...record }
```

`sidebar.right.pane.tab` **只渲染 body**，不会往 tab 列表加项；加列表项必须走 stage 1 的 `sidebarRightTabs.register`。

### 2.5 title / guide（keyed，本轮新增）

```js
// A15：自家 tab 的 chip 标题（与 body 同 key，无 id/order）
ctx.slots.inject('sidebar.right.pane.tab.title', () =>
  ctx.slots.register({ name: 'sidebar.right.pane.tab.title', key: 'api-gallery:right-tab' }, PaneTabTitleDemo));

// C8：自家 tab provider 的 guide 卡（key 使用自家 tab id；live 已确认派发）
ctx.slots.inject('sidebar.right.tab.guide.entry', () =>
  ctx.slots.register({ name: 'sidebar.right.tab.guide.entry', key: 'api-gallery:right-tab' }, GuideEntryDemo));
```

- 两个 keyed 注册都只传 `{ name, key }`；key 是自家 `RIGHT_TAB_ID`，因此只可能替换本插件自己的标题 / fallback guide 卡。
- `PaneTabTitleDemo` 在 `props.useTabInfo` 存在时 try/catch 调用；`GuideEntryDemo` 用 `span role=button`，避免嵌进 owner 的按钮容器。

### 3. 打开

```js
ctx.get('sidebarRight').openTab('api-gallery-demo');
```

- 需要有 on-screen Session；没有 Session 会 throw。本插件捕获并弹 Toast。
- 也可以从右栏的 + 菜单 / guide 打开（`guide` entry 会让它出现在那里）。
- 打开后右栏展开；tab 标题使用打开时捕获的完整标题。

---

## 额外：composer「+」菜单的一项（不是 Slot）

composer 的 `+` 按钮和 `/` 菜单共用一个候选列表。这里没有 Slot；扩展点是 **客户端服务 `ctx.commandUi.register`**（`@deepseek-ai/dsh-client-ui-commands`）：

```js
ctx.inject(['commandUi'], (scope) => {
  scope.effect(() => scope.get('commandUi').register({
    name: 'api-gallery-demo',
    label: () => '图鉴demo · commandUi.register',
    description: () => '客户端命令菜单扩展（不是 Slot）',
    icon: GalleryMenuIcon,
    available: () => true,
    ui: { kind: 'action', run: () => openSlotDetail('commandUi.register') },
  }));
});
```

- 自定义 contribution 会进入 **「指令」分组**末尾；`/` 菜单同样可见，输入 `/api-gallery-demo` 也能触发。
- **「添加」分组**是 `SECTION_ROWS.add = ['file','goal','plan','feedback']` 的固定名单；没有公开接口把自定义项插进「添加」。同名的 Host command 会与 contribution 冲突并报错。
- `ui.kind` 还可以是 `popupSelect`（带搜索/选项）而不是 `action`；本 demo 用 action 打开详情弹层。
- `available(session)` 每次候选渲染都会调用；本 demo 恒为 `true`。

---

## 验证边界

- **保留 15 项**：`conversation.view` / header / dock / input left/right / assistant / turnTail / session row / footer / settings / general / settings.plugins.tab / shell.overlay / hero / 原生右栏 body 的 occupant 全部 active。
- **新增 24 项**：18 A + 6 C 的 id/key 全部在 live `Slots.listSubTree` 中抽查为 active（含少见状态的 onboarding / add.actions / unpreviewable / review.file.actions / plan-review.actions，以及 keyed `api-gallery:right-tab` title/guide）。
- **最后 4 项**：`sidebar.panellist` → `api-gallery-panel` active；`main` → key `api-gallery-panel` active；`tool.call.toolview` → key `api_gallery_demo` active；`conversation.chat.commandview` → key `api-gallery` active。Host 工具 `api_gallery_demo` 已实际调用成功；Host 命令 `/api-gallery` 已注册。
- **原生 tab 的类型注册**无法直接从 Inspect 读到（Inspect 只列 Slot/Service）；body/title/guide 三个 keyed occupant active，说明类型注册没有抛错。
- **未做像素级验证**：当前环境没有浏览器控制入口，入口的视觉位置、弹层点击、main 图标打开面板、tool/command 行渲染都没有截图确认。
- **主题/语言/宿主数据**：Settings 页与原生右侧栏 tab 通过 `/plugin-api-gallery/state` 读取真实 Host 快照；无 Session 时右栏 tab 打不开是预期行为。



