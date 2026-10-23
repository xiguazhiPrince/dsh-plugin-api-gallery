# Slot 分类：应实现 / 不能做可见 UI / 需要决策（task-2）

> **定位**：`dsh-plugin-api-gallery` 下一轮扩展的实现依据。目标不是“把 100 个 Slot 都塞进来”，而是**在不替换任何内置 UI 的前提下**，把能安全追加、且能真正渲染出可见界面的 Slot 做成 demo。
>
> **输入**：`docs/all-slots.md`（task-1 全量 census：100 Slot + 6 Factory）、`catalog.json`（DSH `0.2.1-rc.2` / `2026-10-23`）、`docs/slot-demos.md`、`docs/interface-catalog.md`、`client.js`。
>
> **证据边界**：本文件的 kind/scope/parent/replaceRisk/keyDomain 全部来自静态 census；`ownerProps` 只有 `slot-demos.md` 记录的 15 个 Slot 有确认值，其余标注为“未知（渲染时判空）”。本轮实时 `Slots.listSubTree` 再次超时（见 §8），**没有**用猜测补 ownerProps。
>
> **最终执行说明（Lead 追加）**：这份分类是 task-2 的风险快照。最终实现阶段在 A 的 18 项之外，把 C 的 10 项也全部补齐了（含 main + sidebar.panellist 成对实现、tool.call.toolview 配 Host 工具、conversation.chat.commandview 配 Host 命令、guide.entry 用自家 tab key）。因此本文的“C 本轮不做”已被最终状态覆盖；B 类 57 + 6 Factory 仍保持不注册。实现矩阵见 `docs/slot-demos.md`。
>
> **安全第一**：本文件不因“想覆盖更多 Slot”而建议替换内置 UI。A 类只包含 list 或“文档化注册入口 + fresh key”的 keyed；single、chain、fixed-key、owner-dispatch-only key 一律不进 A。

---

## 1. 结论摘要

### 1.1 三桶计数

| 桶 | Slot 数 | 其中已实现 | 其中新增 | Factory |
| --- | ---: | ---: | ---: | ---: |
| **A. 应实现（additive + 可见 UI）** | **33** | 15 | **18** | 0 |
| **B. 不能做可见 UI（skip）** | **57** | 0 | 0 | 6（全部 skip） |
| **C. 需要决策（needs-decision）** | **10** | 0 | 0 | 0 |
| 合计 | **100** | 15 | 18 | 6 |

B 的 57 构成：43 single + 3 chain + 4 fixed-keyed + 7 owner-dispatch-only open-keyed（与 census §5.6 的“不可增量 57”完全同一集合）。

### 1.2 相对 census 保守候选（43）的 delta

| 口径 | 数量 | 构成 |
| --- | ---: | --- |
| census 保守候选 | 43 | 37 list + 6 keyed（`main` / `sidebar.right.pane.tab` / `sidebar.right.pane.tab.title` / `sidebar.right.tab.guide.entry` / `tool.call.toolview` / `conversation.chat.commandview`） |
| 本分类 A（全部） | 33 | 31 list + 2 keyed |
| ├─ 已实现，保留 | 15 | 14 list + 1 keyed（`sidebar.right.pane.tab`） |
| └─ **本轮新增实现清单** | **18** | **17 list + 1 keyed**（`sidebar.right.pane.tab.title`） |
| 本分类 C | 10 | 6 list + 4 keyed（从 census 43 移出） |
| 本分类 B | 57 | 与 census 不可增量集合相同 |

换算：census 43 中 15 个已实现，剩 28 个；本轮 **18 进 A、10 进 C**（18 + 10 = 28）。没有从 B 提级，也没有把任何 single / chain / fixed-key / owner-dispatch key 放进 A。

### 1.3 判定规则（严格执行）

| 规则 | 结果 |
| --- | --- |
| `kind=list` | 追加一项，永不影响内置项 → 可进 A（仅当渲染上下文可达） |
| `kind=keyed` + **文档化注册入口**（`sidebarRightTabs.register`）+ 与自身 tab 同 key | 可进 A |
| `kind=keyed` + owner 可能派发 fresh key，但公开入口/可达性未证实 | 进 C，不推荐 |
| `kind=keyed` + key 由 owner 注册表派发（owner-dispatch-only） | 进 B（注册了也永远不渲染） |
| `kind=keyed` + fixed keyDomain（ToastKind / UserTextId / ChatNodeKind / Guard-self） | 进 B（不能新增 key） |
| `kind=single`（含 2 个 `replaceRisk=none`） | 进 B（注册即替换该座位唯一节点） |
| `kind=chain`（`select`） | 进 B（selector 路由替换，不是追加） |
| Factory | 进 B（owner 直接渲染，不是注册点） |
| list/keyed 可追加但只在少见状态出现（onboarding / 安装后 / 不可预览 / review / plan-review） | 进 C（技术上安全，但验收不可见） |

---

## 2. A. 应实现（recommended）

### 2.1 A-已实现（15，保留 + 刷新验证，不是本轮新增）

| # | Slot | kind/scope | 展示形态 | 已用 id / key |
| ---: | --- | --- | --- | --- |
| 1 | `conversation.view` | list / session | tab | `api-gallery-view` |
| 2 | `conversation.session.header.utilities` | list / session | icon-button | `api-gallery-header` |
| 3 | `sidebar.right.pane.tab` | keyed / session | page（right-sidebar tab body） | key `api-gallery:right-tab` |
| 4 | `conversation.composer.dock` | list / session | chip | `api-gallery-dock` |
| 5 | `conversation.input.left` | list / session | icon-button | `api-gallery-input-left` |
| 6 | `conversation.input.right` | list / session | icon-button | `api-gallery-input-right` |
| 7 | `conversation.chat.assistant-actions` | list / session | link | `api-gallery-assistant` |
| 8 | `conversation.chat.turnTail` | list / session | row | `api-gallery-turn-tail` |
| 9 | `sidebar.session.row.leading` | list / root | badge | `api-gallery-session-row` |
| 10 | `sidebar.footer.action` | list / root | button | `api-gallery-footer` |
| 11 | `settings.section` | list / root | page | `api-gallery-settings` |
| 12 | `settings.general.item` | list / root | row | `api-gallery-general` |
| 13 | `settings.plugins.tab` | list / root | tab | `api-gallery-plugins-tab` |
| 14 | `shell.overlay` | list / root | modal + toast | `api-gallery-overlay` |
| 15 | `conversation.hero.options` | list / session | button | `api-gallery-hero` |

> 15 个 id 的 ownerProps 与落点见 `docs/slot-demos.md`。本轮不重复实现，只在新增 18 项落地后一起做一次“刷新页面逐个点开”的回归。

### 2.2 A-新增（18 项 = 下一 subagent 的实现清单）

约定：`id` 一律 `api-gallery-<slug>`，与已有 14 个 list id 无冲突；list 注册 `{ name, id, order?, label? }`，keyed 注册只传 `{ name, key }`。所有条目点击统一走现有 `openSlotDetail()` → `shell.overlay` 弹层，避免各自造弹层。

#### 组 1：Settings（2）

| # | Slot | kind/scope | 为什么是 additive | 展示形态 | 需要的 owner props | 建议 id / key | order | demo 内容（一行） |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- |
| A1 | `settings.models.footer` | list / root | provider 行与 add 控件之后的有序扩展区，追加行 | row | 未知（标准 list props，渲染时判空） | `api-gallery-models-footer` | 50 | 一行「图鉴demo · settings.models.footer」+「详情」按钮 |
| A2 | `settings.action` | list / root | 设置内容列 header、Close 之前的可选动作 | button | 无（settings 标准 props） | `api-gallery-settings-action` | 50 | 一个「图鉴」按钮，点击开详情弹层 |

#### 组 2：Sidebar / workspaces（3）

| # | Slot | kind/scope | 为什么是 additive | 展示形态 | 需要的 owner props | 建议 id / key | order | demo 内容（一行） |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- |
| A3 | `sidebar.workspaces.session.menu.item` | list / root | 某个 Session “...” 菜单的行，按 order 追加在内置项后 | menu-item | 未知（菜单上下文，可能含 session；判空） | `api-gallery-session-menu` | 60 | 菜单里一行「图鉴demo」，点击开详情 |
| A4 | `sidebar.workspaces.session.row.action` | list / root | Session 行末尾悬停按钮，排在 “...” 之后 | icon-button | 未知（可能 `{ sessionId }`；判空） | `api-gallery-session-row-action` | 60 | hover 行时出现 14px「图」按钮 |
| A5 | `sidebar.session.row.hover` | list / root | hover 卡中相对时间与尾部状态行之间的一段，追加 | row | 未知（可能 `{ sessionId }`；判空） | `api-gallery-session-hover` | 50 | hover 卡里一行「图鉴demo · row.hover」 |

#### 组 3：Plugins（Settings → Plugins）（5）

| # | Slot | kind/scope | 为什么是 additive | 展示形态 | 需要的 owner props | 建议 id / key | order | demo 内容（一行） |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- |
| A6 | `plugins.tab` | list / root | 页面自带 Installed 之后追加 tab，label 命名、order 定位 | tab | `label` 投影 tab 名；页面上下文未知（判空） | `api-gallery-plugins-page-tab` | 60 | 一个「图鉴demo」tab，页内复用 `SlotPage` 展示 |
| A7 | `plugins.item` | list / root | 官方 plugin 列表 Official 组、官方 bundle 之后追加一项 | row / card | `label` 作卡片标题；卡片 subject 未知（判空） | `api-gallery-plugin-item` | 60 | 一张「图鉴demo」plugin 卡片 |
| A8 | `plugins.detail.actions` | list / root | 详情页头部、switch/uninstall 之前追加控件 | button | 详情页 subject（页面主题对象，未知；判空） | `api-gallery-detail-actions` | 50 | 详情页头部「图鉴」按钮 |
| A9 | `plugins.detail.badge` | list / root | 详情页标题旁、版本/beta/问题标签之后追加标签 | badge | 详情页 subject（未知；判空） | `api-gallery-detail-badge` | 50 | 标题旁一个「图鉴demo」标签 |
| A10 | `plugins.detail.section` | list / root | 详情页自有内容之下的区块，追加 | inline-panel | 详情页 subject（未知；判空） | `api-gallery-detail-section` | 50 | 详情页下方一块说明区 + 注册代码 |

#### 组 4：Conversation header（1）

| # | Slot | kind/scope | 为什么是 additive | 展示形态 | 需要的 owner props | 建议 id / key | order | demo 内容（一行） |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- |
| A11 | `conversation.session.header.actions` | list / session | 标题旁边的 Session 动作，按 order 追加 | button | 无（标准 props） | `api-gallery-header-actions` | 50 | 标题旁一个「图鉴」按钮（比 utilities 更靠标题） |

#### 组 5：右侧栏（4）

| # | Slot | kind/scope | 为什么是 additive | 展示形态 | 需要的 owner props | 建议 id / key | order | demo 内容（一行） |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- |
| A12 | `sidebar.right.tab.files.actions` | list / session | 文件树 reload 控件之后追加工作区目录动作 | icon-button | 文件树上下文（可能含 workspace/path；判空） | `api-gallery-files-actions` | 50 | Files tab 工具栏一个「图」按钮 |
| A13 | `sidebar.right.tab.document.actions` | list / session | 预览文件 header 工具栏、预览控件之后追加 | button | 已预览文件的 Host path（catalog 明示“path known 后渲染”） | `api-gallery-document-actions` | 50 | 文档预览工具栏「图鉴」按钮 |
| A14 | `sidebar.right.tab.menu.item` | list / session | 某个 tab 动作菜单末尾追加，按注册顺序 | menu-item | tab 菜单上下文（未知；判空） | `api-gallery-right-menu` | 60 | 图鉴右侧栏 tab 的 “...” 菜单里多一行 |
| A15 | `sidebar.right.pane.tab.title` | keyed / session | key = 自家 tab type id（`api-gallery:right-tab`），只为自家 tab 渲染标题，无内置可替换 | chip（tab 标题） | `useTabInfo()` → `{ sidebar, panel, tab }` | key `api-gallery:right-tab`（与 body 同 key，keyed 无 id/order） | — | 把图鉴 tab 的 chip 标题画成自定义样式 |

> A15 是本轮唯一新增 keyed。安全性依据：同一 key 已由文档化的 `sidebarRightTabs.register` 创建，且只属于本插件，不存在“替换内置 tab 标题”。

#### 组 6：Conversation chat / deliverables（1）

| # | Slot | kind/scope | 为什么是 additive | 展示形态 | 需要的 owner props | 建议 id / key | order | demo 内容（一行） |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- |
| A16 | `deliverables.file.actions` | list / session | Turn 尾行内追加“打开授权文件”动作 | link | 可能是 Session event 坐标 / `openFile` 一类（未知；判空，不主动打开文件） | `api-gallery-file-actions` | 50 | Turn 尾行一个「图鉴demo」链接，只开详情、不真开文件 |

#### 组 7：Composer（2）

| # | Slot | kind/scope | 为什么是 additive | 展示形态 | 需要的 owner props | 建议 id / key | order | demo 内容（一行） |
| ---: | --- | --- | --- | --- | --- | --- | ---: | --- |
| A17 | `conversation.input.overlay` | list / session | composer 卡内浮动条目，追加 | chip | 无（标准 props） | `api-gallery-input-overlay` | 50 | composer 卡内一个浮动「图鉴」chip |
| A18 | `conversation.input.dock` | list / session | composer 卡上方通栏条目，追加 | row（full-width） | 无（标准 props） | `api-gallery-input-dock` | 50 | composer 上方一行通栏「图鉴demo」条目 |

### 2.3 展示形态统计 + 实现计划

新增 18 项的展示形态分布：

| 展示形态 | 数量 | Slot |
| --- | ---: | --- |
| button | 4 | A2 settings.action、A8 plugins.detail.actions、A11 header.actions、A13 document.actions |
| icon-button | 2 | A4 session.row.action、A12 files.actions |
| menu-item | 2 | A3 session.menu.item、A14 right.tab.menu.item |
| row | 4 | A1 models.footer、A5 session.row.hover、A7 plugins.item、A18 input.dock |
| chip | 2 | A15 pane.tab.title、A17 input.overlay |
| tab | 1 | A6 plugins.tab |
| badge | 1 | A9 plugins.detail.badge |
| inline-panel | 1 | A10 plugins.detail.section |
| link | 1 | A16 deliverables.file.actions |

**复用结论**：18 项中 **15 项可共用一个通用组件**——`<GalleryEntry mode="button|icon-button|menu-item|row|badge|link|chip" label? compact? detailKey>`，默认点击 `openSlotDetail(key)`；`chip` 仅用于 input.overlay（pane.tab.title 要 hook，单独实现）。**3 项需要 bespoke**：

| bespoke | 原因 |
| --- | --- |
| `plugins.tab` | 需要 tab 页面 body，复用现有 `SlotPage` + CodeBlock，不是一行控件 |
| `plugins.detail.section` | 需要区块内容（说明 + 注册代码），复用 `SlotPage` 内部块 |
| `sidebar.right.pane.tab.title` | 必须调用 `useTabInfo()` 取 `{ sidebar, panel, tab }` 并返回 chip 内容，无法走通用 props |

**分批（18 项）**：

| 批次 | 数量 | 内容 | 依据 |
| --- | ---: | --- | --- |
| P1 低风险、上下文稳定 | 5 | Settings 2 + header.actions + plugins.tab + plugins.item | 现有 Settings/Plugins 页已可达，无需特殊状态 |
| P2 右侧栏 / 详情页 | 6 | plugins.detail.actions / badge / section + files.actions + document.actions + right.tab.menu.item | 需要打开 Plugins 详情或右栏 Files/Document tab；用现有图鉴右栏 tab 做自测入口 |
| P3 会话行 / composer / deliverables | 7 | session.menu.item + session.row.action + session.row.hover + input.overlay + input.dock + deliverables.file.actions + pane.tab.title | 依赖 hover / 菜单 / 已交付 Turn 等状态，逐个截图验收 |

**验收标准**（每个新增项）：a) 不覆盖任何内置 id（全部 `api-gallery-*`）；b) 出现在文档描述的位置（或明确记录未出现）；c) 点击不抛错；d) 文案 `图鉴demo · <slot>`；e) HMR 重载后不重复注册（`ctx.effect` 清理）。

---

## 3. B. 不能做可见 UI（skip，57 Slot + 6 Factory）

### 3.1 single：43 个（owner 只渲染一个节点，注册即替换）

| 区域 | Slots（43） | 具体原因 |
| --- | --- | --- |
| root / frame | `root`, `shell.bottom`, `shell.leading` | single 根洞 / 框架底部通栏 / 窗口 chrome。注册即替换 shell 自身渲染的节点或框架结构 |
| sidebar | `sidebar`, `sidebar.brand.mark`, `sidebar.brand.name`, `sidebar.toggle.badge`, `sidebar.settings` | 整个左列、品牌 mark/name、折叠徽标、Settings 座位，各只有一个节点 |
| workspaces | `sidebar.workspaces`, `sidebar.workspaces.directoryFlow` | 工作区浏览区单节点；directoryFlow 是入口声明的唯一目录流洞 |
| settings chrome | `settings.trigger`, `settings.header`, `settings.close`, `settings.models.sign-in`, `settings.launcher` | 设置触发行、标题、关闭按钮标签、登录位、launcher，均为单座位 |
| conversation 外壳 / header | `main.conversation`, `conversation.header`, `conversation.header.leading`, `conversation.session.header`, `conversation.session.header.corner`, `conversation.session.header.lineage` | 会话壳 / header 容器 / 标题旁唯一角落 / 面包屑替换位。`header.leading` 与 `lineage` 的 replaceRisk 虽为 `none`，仍无“追加”语义：注册会占用该唯一座位 |
| conversation 主体 / chat | `conversation.session`, `conversation.trajectory.images`, `conversation.chat.flow`, `conversation.chat.message.images`, `conversation.chat.reasoning.body` | 会话主体与各类渲染器单节点，替换会破坏内置消息流 |
| composer | `conversation.approval.detail`, `conversation.composer.bar`, `conversation.input.attachments`, `conversation.input.permission`, `conversation.input.model`, `conversation.input.model.label`, `conversation.input.plan`, `conversation.input.activity` | composer 主体与各工具行控件都是单节点；模型标签甚至是非交互内联文本 |
| hero | `conversation.hero.workspace`, `conversation.hero.workspace.directoryFlow`, `conversation.hero.brand.mark`, `conversation.hero.agentPreset` | 空态 Hero 的 workspace 选择器 / 目录流 / 品牌标记 / preset 控件，均单节点（`brand.mark` replaceRisk=none 但注册即独占该位） |
| 用户图片 | `conversation.chat.user.images` | 用户消息图片渲染器单节点 |
| right sidebar | `rightbar`, `rightbar.session`, `sidebar.chat.conversation` | 右列、Session 内容、Sidebar chat 承载，均单节点 |
| tool 图片渲染器 | `tool.call.images` | 含图 Tool call 的持久图片渲染器单节点 |

> 合计 43。判定：**没有“再加一个”的语义**，任何注册都是 replacement，违反安全第一原则。已实现插件对 single 占用为 0，保持不变。

### 3.2 chain：3 个（selector 路由替换）

| Slot | 原因 |
| --- | --- |
| `shell.quota-notice` | `select(owner) => unknown \| null` 命中即替换内置配额提示链，不是追加 |
| `sidebar.right.tab.guide` | guide tab body 的 selector 路由替换 |
| `conversation.composer` | 当前 Session composer 的 selector 路由替换，命中即换掉整个 composer |

### 3.3 fixed-key keyed：4 个（key 集合由 owner 键表 / Guard 固定）

| Slot | keyDomain | 已占 | 为什么不能新增 key |
| --- | --- | ---: | --- |
| `workspace.toast` | `ToastKind`（`{ [K in ToastKind]: ToastNotice<K> }`） | 11 | 只接受枚举内已定义 kind，新 key 不存在 |
| `conversation.user.text.node` | `UserTextId` 键表 | 7 | 只接受 `command/file/folder/secret/session/skill/text`，无法新增 |
| `conversation.chat.node` | `ChatNodeKind` 键表 | 19 | 只接受 19 种节点类型；新增 key 不派发 |
| `tool.view.cordis` | 动态 Client Guard 的 `allowedKeys`，仅 `self` 且绑定 pluginId/packageId | 1（self） | key 由 Guard 固定，不是通用扩展点 |

### 3.4 owner-dispatch-only open key：7 个（census §5.5）

| Slot | 原因（key 由 owner 自身注册表派发，插件无法注入） |
| --- | --- |
| `settings.models.provider-card` | key = `settingsNs`，只在模型 provider 卡内派发；本插件不是 provider，没有卡可挂 |
| `plugins.bundle.config` | key = bundle 包名，只在该 bundle 自己的页面渲染；不是通用扩展点（且仅 `view: 'page'`） |
| `plugins.bundle.activation` | key = npm 包名，只在“用户从列表启用某 bundle 后”派发 |
| `plugins.row.config` | key = bundle patch 声明的 `<包名>#<row id>`，插件不声明该行就没有 key |
| `sidebar.right.tab.document` | key = 已注册 document 实现 id，由 document registry 派发 |
| `sidebar.right.tab.document.office.pdf` | key = Office 转换字节专用路径 |
| `sidebar.right.tab.document.action` | key = document renderer 专属，只有对应 renderer 才能命中 |

> 这 7 个 = census 的“结构口径可增量（50）− 保守口径（43）”。注册 fresh key 也不会渲染（owner 永远不 dispatch），属“可增量但不可见”，故 skip。

### 3.5 Factory：6 个（owner 渲染的子界面，不是注册点）

| Factory | scope | 原因 |
| --- | --- | --- |
| `conversation.images.content` | root | 由 owner 直接渲染的图片内容子界面，没有 `register` API |
| `workspace.toast.content` | root | toast 内容渲染器，owner 内部使用 |
| `conversation.user.text` | session | 用户文本内容子界面，owner 渲染 |
| `conversation.content` | session-maybe | 会话内容工厂，owner 渲染 |
| `conversation.chat.reasoning.content` | root | reasoning 内容工厂，owner 渲染 |
| `conversation.chat.user.content` | session | 用户消息内容工厂，owner 渲染 |

> Factory 是“拥有者渲染的子界面”，Slot 才是插件注册席位。**不要尝试注册 Factory。**

---

## 4. C. 需要决策（needs-decision，10）

技术上都可追加，但要么出现条件苛刻、要么 owner 入口未证实、要么会干扰导航。**本轮默认不做**，需要 Lead/用户拍板。

| # | Slot | kind/scope | 追加安全性 | 风险 / 取舍 | 建议 |
| ---: | --- | --- | --- | --- | --- |
| C1 | `main` | keyed open（已占 1：conversation） | fresh key 本身不替换内置 conversation 面板 | 可见性依赖 `sidebar.panellist` 的 entry id 与 main key 对齐；对齐失败 = 永远不可达；对齐成功 = 一个中央面板，进入/退出会切换走 conversation（导航行为，不是替换） | **本轮不做**。若要做，必须与 `sidebar.panellist` 成对实现并现场验证“点击图标 → 中央面板打开”；验证失败立即回滚 |
| C2 | `sidebar.panellist` | list / root | 图标追加是安全的 | entry 描述符契约未知（可能要求 panel id / 激活态），点击可能无反应；单独加图标只会得到一个“死按钮” | **本轮不做**；`sidebar.footer.action` 已覆盖侧栏底部入口。若 C1 验证通过，再与 C1 一起提级为 A |
| C3 | `settings.onboarding` | list / root | 追加 safe | 只在 onboarding 流程中渲染；当前 profile 已完成引导，极可能永远看不到 | **不做**，验收不可见 |
| C4 | `plugins.add.actions` | list / root | 追加 safe | 只在“bundle 安装完成”后的状态渲染；需要现场安装一个 bundle 才能看到 | **不做**，验收成本高且会改动 profile |
| C5 | `sidebar.right.tab.document.unpreviewable` | list / session | 追加 safe | 只在文件“无法预览”时渲染，需要特意打开一个不可渲染文件；属于错误空态 | **不做**（或仅作为“安全但隐藏”项记录） |
| C6 | `deliverables.review.file.actions` | list / session | 追加 safe | 只在 changed-file review tab 存在时渲染；依赖 review 工作流状态 | **本轮不做**，待有稳定 review 场景再评估 |
| C7 | `conversation.plan-review.actions` | list / session | 追加 safe | 只在 plan 正在 review 的瞬时状态渲染，正常聊天流程中不出现 | **本轮不做** |
| C8 | `sidebar.right.tab.guide.entry` | keyed / session | 文档化入口 `sidebarRightTabs.register` 的 guide 可注册，但 **key 语义未证实**（provider id？guide entry id？） | key 不匹配则永远不派发；匹配则得到一张 guide 卡（替换我们自己 provider 的 fallback 标准卡，属自家范围） | **先不做**；需要一次 live 验证（本轮 2 次查询均超时）。验证通过可提级 A（guide card，`order` 由 guide 注册决定） |
| C9 | `tool.call.toolview` | keyed open（已占 54 个内置 tool 名） | fresh key 需自有 tool 名 | 插件当前**不注册任何 tool**（`index.js` 明确“不注册 tool/command/prompt”）；没有 tool 就永远没有 tool call 卡；复用内置 tool 名会替换内置 view（禁止） | **不做**。除非未来新增自有 tool，否则无可见性 |
| C10 | `conversation.chat.commandview` | keyed open（空） | fresh key = command 名 | command 行只在聊天中出现对应 command；本插件的 `commandUi.register` 是菜单 action，不产生 command 行；没有证据表明 owner 会派发该 key | **不做**；若未来注册真正的 slash command 再评估 |

**C 的总体建议**：10 个全部保持 skip 状态；只有 C1+C2（成对）与 C8（需 live 验证）有机会在下一轮提级，且必须先验证再实现。

---

## 5. Do-not-implement 表（按原因归类）

| 原因 | 数量 | Slots / 对象 | 处理 |
| --- | ---: | --- | --- |
| single：注册即替换唯一节点 | 43 | §3.1 全部 43 个（`root`、`sidebar*`、`settings.trigger/header/close/*`、`conversation.session.header*`、`conversation.session`、`conversation.chat.flow`、composer 各控件、hero 各控件、`rightbar*`、`tool.call.images`、`conversation.chat.user.images` 等） | 永不注册 |
| chain：selector 替换路由 | 3 | `shell.quota-notice`、`sidebar.right.tab.guide`、`conversation.composer` | 永不注册 |
| fixed keyDomain | 4 | `workspace.toast`、`conversation.user.text.node`、`conversation.chat.node`、`tool.view.cordis` | 永不注册（无法新增 key） |
| owner-dispatch-only open key | 7 | `settings.models.provider-card`、`plugins.bundle.config`、`plugins.bundle.activation`、`plugins.row.config`、`sidebar.right.tab.document`、`sidebar.right.tab.document.office.pdf`、`sidebar.right.tab.document.action` | 永不注册（注册了也不渲染） |
| Factory 非注册点 | 6 | `conversation.images.content`、`workspace.toast.content`、`conversation.user.text`、`conversation.content`、`conversation.chat.reasoning.content`、`conversation.chat.user.content` | 永不注册 |
| 可追加但上下文不可验收 | 6 | `settings.onboarding`、`sidebar.panellist`、`plugins.add.actions`、`sidebar.right.tab.document.unpreviewable`、`deliverables.review.file.actions`、`conversation.plan-review.actions` | C，本轮不做 |
| keyed 可达性未证实 / 无派发条件 | 4 | `main`、`sidebar.right.tab.guide.entry`、`tool.call.toolview`、`conversation.chat.commandview` | C，验证后再议 |

> 计数口径：**100 Slot = A 33 + B 57 + C 10**（B、C 合计 67 个 Slot 不做可见 UI），另有 **6 个 Factory** 全部 skip，合计 73 个“不做”对象。10 个 C 类保留潜在提级路径，但本轮一律不实现。

---

## 6. 给实现者的安全约束

1. **只用 A-新增 18 项**，不要碰 `single` / `chain` / fixed-key / owner-dispatch key；不要为了凑数注册 `main` 或 `sidebar.panellist`。
2. 所有 `id` 用 `api-gallery-<slug>`，禁止复用内置 id；`label` 统一 `图鉴demo · <slot>`（`settings.models.footer`、`plugins.item` 等不投影 label 的座位由内容自己画标题）。
3. 每个注册都用 `ctx.slots.inject(slot, () => ctx.slots.register(...))` 包裹；HMR 下依赖 effect 清理，不得重复注册。
4. ownerProps 静态未知的一律按 `undefined` 防御式渲染（`A5/A12/A13/A16` 尤其），**不要主动触发** `openFile` / 打开文件等有副作用动作，点击只开 `shell.overlay` 详情。
5. `sidebar.right.pane.tab.title` 必须复用已存在的 `api-gallery:right-tab` key；keyed 注册只传 `{ name, key }`，不存在 `id/order`。
6. 详情弹层统一走现有 `openSlotDetail(key, extra)`；新增 META 时补齐 `kind/scope/code/desc`，保持“注册代码可复制”的一致体验。
7. 若某项实测无法出现（例如 Plugins 详情页结构变化），**记录并跳过**，不要改成注册 single 去“强行可见”。

---

## 7. 本轮新增 18 项一览（速查）

| 组 | Slot | id / key | mode |
| --- | --- | --- | --- |
| Settings | `settings.models.footer` | `api-gallery-models-footer` | row |
| Settings | `settings.action` | `api-gallery-settings-action` | button |
| Sidebar | `sidebar.workspaces.session.menu.item` | `api-gallery-session-menu` | menu-item |
| Sidebar | `sidebar.workspaces.session.row.action` | `api-gallery-session-row-action` | icon-button |
| Sidebar | `sidebar.session.row.hover` | `api-gallery-session-hover` | row |
| Plugins | `plugins.tab` | `api-gallery-plugins-page-tab` | tab |
| Plugins | `plugins.item` | `api-gallery-plugin-item` | row |
| Plugins | `plugins.detail.actions` | `api-gallery-detail-actions` | button |
| Plugins | `plugins.detail.badge` | `api-gallery-detail-badge` | badge |
| Plugins | `plugins.detail.section` | `api-gallery-detail-section` | inline-panel |
| Header | `conversation.session.header.actions` | `api-gallery-header-actions` | button |
| Right bar | `sidebar.right.tab.files.actions` | `api-gallery-files-actions` | icon-button |
| Right bar | `sidebar.right.tab.document.actions` | `api-gallery-document-actions` | button |
| Right bar | `sidebar.right.tab.menu.item` | `api-gallery-right-menu` | menu-item |
| Right bar | `sidebar.right.pane.tab.title` | key `api-gallery:right-tab` | chip |
| Chat | `deliverables.file.actions` | `api-gallery-file-actions` | link |
| Composer | `conversation.input.overlay` | `api-gallery-input-overlay` | chip |
| Composer | `conversation.input.dock` | `api-gallery-input-dock` | row |

---

## 8. 数据来源与失败查询

| 来源 | 用途 | 状态 |
| --- | --- | --- |
| `docs/all-slots.md` | 100 Slot + 6 Factory 的 kind/scope/parent/replaceRisk/keyDomain/注册选项（主输入） | 已用 |
| `catalog.json` | 交叉核对 name/kind/scope/parent/replaceRisk/registration（无 ownerProps 字段） | 已用 |
| `docs/slot-demos.md` | 15 个已实现 Slot 的 ownerProps、id、落点、右侧栏两段式注册 | 已用 |
| `docs/interface-catalog.md` | Slot 英文用途、已知边界（`sidebarRightTabs.register` 不在 Inspect 目录等） | 已用 |
| `client.js` / `index.js` | 现有实现、`openSlotDetail`/`META`/通用组件可复用性；确认插件不注册 tool | 已用 |
| live `cordis_inspect_query` client/Slots/listSubTree | 补充 `sidebar.panellist`、`sidebar.right.tab.guide.entry` 的 ownerProps/occupants | **超时** |

失败的实时查询（按“超时一次即记录并继续”执行，未重试、未猜测）：

| # | 调用 | input | 结果 |
| ---: | --- | --- | --- |
| 1 | `client / Slots / listSubTree` | `{ "root": "sidebar.panellist" }` | `timed out after 10000ms`（提示：Open or reconnect the Harness page） |
| 2 | `client / Slots / listSubTree` | `{ "root": "sidebar.right.tab.guide.entry" }` | `timed out after 10000ms` |

> 这与 census §6 的“live 查询全部超时”一致。结论：C2（panellist 契约）与 C8（guide.entry key 语义）维持“需要决策”，不凭猜测提级；其余分类不依赖 live 数据即可给出。

---

## 9. 一句话给 Lead

A 新增 18 个（17 list + 1 自家 tab 的 keyed 标题），其中 15 个可共用一个 `GalleryEntry` 组件，3 个 bespoke；B 57 个（43 single + 3 chain + 4 fixed + 7 owner-dispatch）+ 6 Factory 永不注册；C 10 个（6 个状态不可验收的 list + 4 个可达性未证实的 keyed）本轮全部跳过。零替换内置 UI，零 fixed-key，零 single。
