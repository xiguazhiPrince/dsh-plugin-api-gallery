# DSH Web Client Slot / Factory 全量清单（0.2.1-rc.2）

> 数据来源：`catalog.json`（meta：DSH `0.2.1-rc.2`，scannedAt `2026-10-23`）+ `.scan/client-Slots-listSubTree.full.json`（无 root 的完整树）。
> 实时 `cordis_inspect_query`（platform=client, provider=Slots, method=listSubTree）**全部超时**（见 §6），因此 occupants / ownerProps 只采用已有静态证据，不做猜测。
> 口径：Inspect 树共 **106 个节点 = 100 个 Slot + 6 个 Factory**；本文所有统计除非注明，均指 Slot（Factory 单列）。
>
> **实现状态说明**：本文的“本插件已实现?”列是 task-1 时点的 15 个基线。最终实现阶段已把 43 个可增量 Slot（15 原有 + 18 A + 10 C）全部注册；最新矩阵见 `docs/slot-demos.md`，分类依据见 `docs/slot-classification.md`。B 类 57 + 6 Factory 仍不注册。

**图例**：注册 `id* / order? / label?` = list 的注册选项（`*` 必填）；`key*` = keyed；`select*` = chain；`—` = single/factory 由 owner 直接渲染、无注册选项。ownerProps 列 `—` = 静态快照未提供；occupants 列 `—` = 本次未采集（非“空”）。

---

## 1. 汇总

### 1.1 总量与 kind

| 项 | 数量 |
| --- | ---: |
| Slot 总数 | 100 |
| Factory 总数 | 6 |
| kind=single | 43 |
| kind=list | 37 |
| kind=keyed | 17 |
| kind=chain | 3 |
| kind=factory | 6 |

### 1.2 按 scope

| scope | Slot | Factory |
| --- | ---: | ---: |
| root | 46 | 3 |
| session | 49 | 2 |
| session-maybe | 5 | 1 |
| 合计 | 100 | 6 |

### 1.3 按 replaceRisk（Slot）

| replaceRisk | 数量 | 说明 |
| --- | ---: | --- |
| none | 52 | 新 id/key 为增量，未见内置 UI 遮蔽 |
| shadows-shipped-ui | 48 | 复用内置 id/key 会替换内置 UI；新 id/key 通常仍是增量 |
| 合计 | 100 | Factory 无该字段（6） |

kind × replaceRisk：

| kind | none | shadows-shipped-ui |
| --- | ---: | ---: |
| single | 2 | 41 |
| list | 37 | 0 |
| keyed | 10 | 7 |
| chain | 3 | 0 |

### 1.4 按 key 形态（注册入口）

| 注册形态 | 数量 | 说明 |
| --- | ---: | --- |
| list：fresh `id` | 37 | 唯一可“加一项”的通用形态 |
| keyed：open keyDomain | 13 | 接受新 key，但 key 由 owner 派发 |
| keyed：fixed keyDomain | 4 | key 集合由 owner 键表 / Client Guard 固定 |
| chain：`select` | 3 | selector 路由替换，不是追加 |
| single：无注册 | 43 | owner 只渲染一个节点 |
| factory：无注册 | 6 | owner 直接渲染的子界面 |

fixed keyDomain（4）：`workspace.toast`（ToastKind）、`conversation.user.text.node`（UserTextId）、`conversation.chat.node`（ChatNodeKind）、`tool.view.cordis`（`allowedKeys` 仅 `self`，由 Guard 绑定）。

---

## 2. 区域清单

### 2.1 root / frame（6）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `root` | slot | single | root | — | 内置渲染树根洞：shell 唯一渲染的 slot，也是其他所有 seat 的祖先。 | — | — | — | shadows-shipped-ui | — | — |
| `shell.overlay` | slot | list | root | `root` | 框架级浮层，位于所有列之上、滚动容器之外。 | id*, order?, label? | — | — | none | — | ✅ `api-gallery-overlay` |
| `shell.quota-notice` | slot | chain | root | `shell.overlay` | 框架级配额提示链。 | select* | — | — | none | — | — |
| `workspace.toast` | slot | keyed | root | `shell.overlay` | 按既有业务判别键选择的工作区通知。 | key* | — | fixed：ToastKind（已占 11） | shadows-shipped-ui | — | — |
| `shell.bottom` | slot | single | root | `root` | 三列下方通栏底部内容。 | — | — | — | shadows-shipped-ui | — | — |
| `shell.leading` | slot | single | root | `root` | 框架左上角窗口 chrome 座位，覆盖所有主面板。 | — | — | — | shadows-shipped-ui | — | — |

### 2.2 sidebar（7）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sidebar` | slot | single | root | `root` | 整个左列。 | — | — | — | shadows-shipped-ui | — | — |
| `sidebar.brand.mark` | slot | single | root | `sidebar` | 展开品牌行与折叠栏中的品牌标记。 | — | — | — | shadows-shipped-ui | — | — |
| `sidebar.brand.name` | slot | single | root | `sidebar` | 展开品牌标记旁的品牌名。 | — | — | — | shadows-shipped-ui | — | — |
| `sidebar.toggle.badge` | slot | single | root | `sidebar` | 折叠侧栏展开按钮内的非交互通知徽标。 | — | — | — | shadows-shipped-ui | — | — |
| `sidebar.settings` | slot | single | root | `sidebar` | 侧栏底部的 Settings 座位。 | — | — | — | shadows-shipped-ui | — | — |
| `sidebar.footer.action` | slot | list | root | `sidebar` | Settings 旁的可选动作。 | id*, order?, label? | `{ wide }` | — | none | — | ✅ `api-gallery-footer` |
| `sidebar.panellist` | slot | list | root | `sidebar` | 全局面板图标。 | id*, order?, label? | — | — | none | — | — |

### 2.3 workspaces / session rows（6）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sidebar.workspaces` | slot | single | root | `sidebar` | 工作区/会话浏览区域：标题、搜索、分组/平铺会话列表与全部工作区对话框。 | — | — | — | shadows-shipped-ui | — | — |
| `sidebar.workspaces.session.menu.item` | slot | list | root | `sidebar.workspaces` | 某个 Session “...” 菜单的行，按 `order` 升序。 | id*, order?, label? | — | — | none | — | — |
| `sidebar.workspaces.session.row.action` | slot | list | root | `sidebar.workspaces` | 某个 Session 行末尾的悬停按钮，排在 “...” 触发器之后。 | id*, order?, label? | — | — | none | — | — |
| `sidebar.workspaces.directoryFlow` | slot | single | root | `sidebar.workspaces` | 浏览区域下方的目录流洞（WorkspaceBrowser 入口声明）。 | — | — | — | shadows-shipped-ui | — | — |
| `sidebar.session.row.leading` | slot | list | root | `sidebar.workspaces` | Session 行标题前 16px 的前导装饰（原状态点占位）。 | id*, order?, label? | `{ sessionId }` | — | none | — | ✅ `api-gallery-session-row` |
| `sidebar.session.row.hover` | slot | list | root | `sidebar.workspaces` | Session 行 hover 卡中相对时间与尾部状态行之间的一段。 | id*, order?, label? | — | — | none | — | — |

### 2.4 settings（12）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `settings.section` | slot | list | root | `sidebar.settings` | 每个列表项一页设置。 | id*, order?, label? | `{ close }` | — | none | — | ✅ `api-gallery-settings` |
| `settings.general.item` | slot | list | root | `settings.section` | General 段内的单条偏好行（无需独立页面的单项设置）。 | id*, order?, label? | `{}`（不投影 label） | — | none | — | ✅ `api-gallery-general` |
| `settings.plugins.tab` | slot | list | root | `settings.section` | Plugins 设置段内的一页。 | id*, order?, label? | `{}` | — | none | — | ✅ `api-gallery-plugins-tab` |
| `settings.models.provider-card` | slot | keyed | root | `settings.section` | 每个 provider 卡的适配器扩展区，按 `entryKey = settingsNs` 派发。 | key* | — | open（空） | none | — | — |
| `settings.models.footer` | slot | list | root | `settings.section` | provider 行与 add 控件之后的有序扩展区。 | id*, order?, label? | — | — | none | — | — |
| `settings.trigger` | slot | single | root | `sidebar.settings` | 侧栏底部触发行内容：icon + label。 | — | — | — | shadows-shipped-ui | — | — |
| `settings.header` | slot | single | root | `sidebar.settings` | 设置面板标题文本位。 | — | — | — | shadows-shipped-ui | — | — |
| `settings.action` | slot | list | root | `sidebar.settings` | 内容列 header 中 Close 之前的可选动作。 | id*, order?, label? | — | — | none | — | — |
| `settings.close` | slot | single | root | `sidebar.settings` | 关闭按钮的视觉隐藏标签文本（按钮本体属 shell chrome）。 | — | — | — | shadows-shipped-ui | — | — |
| `settings.onboarding` | slot | list | root | `sidebar.settings` | settings 特性贡献的 root 级 onboarding 步骤。 | id*, order?, label? | — | — | none | — | — |
| `settings.models.sign-in` | slot | single | root | `settings.onboarding` | 凭据编辑器之前可选的账号登录选择。 | — | — | — | shadows-shipped-ui | — | — |
| `settings.launcher` | slot | single | root | `sidebar.settings` | 可选侧栏账号启动器；打开 shell 自有的设置面板。 | — | — | — | shadows-shipped-ui | — | — |

### 2.5 main / plugins（10）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `main` | slot | keyed | root | `root` | 按 sidebar entry id 选择的中央面板。 | key* | — | open（已占 1：conversation） | shadows-shipped-ui | — | — |
| `plugins.bundle.config` | slot | keyed | root | `main` | bundle 自有配置，按包名 keyed，渲染在 bundle 页描述与行之间（`view: 'page'`）。 | key* | — | open（已占 2） | shadows-shipped-ui | — | — |
| `plugins.add.actions` | slot | list | root | `main` | 安装后追加的 MenuItemButton 行（72px 高，标题 + 两行描述）。 | id*, order?, label? | — | — | none | — | — |
| `plugins.tab` | slot | list | root | `main` | 页面自带 Installed 之后的 tab，如 Discover。 | id*, order?, label? | — | — | none | — | — |
| `plugins.item` | slot | list | root | `main` | 官方 plugin 列表中 official bundles 之后的一项。 | id*, order?, label? | — | — | none | — | — |
| `plugins.bundle.activation` | slot | keyed | root | `main` | 用户从列表启用 bundle 后的可选引导，按 npm 包名 keyed。 | key* | — | open（已占 1） | shadows-shipped-ui | — | — |
| `plugins.row.config` | slot | keyed | root | `main` | bundle 声明的某一行的配置，按 `<包名>#<row id>` keyed。 | key* | — | open（空） | none | — | — |
| `plugins.detail.actions` | slot | list | root | `main` | 详情页头部控件，在页面自带 switch/uninstall 之前。 | id*, order?, label? | — | — | none | — | — |
| `plugins.detail.badge` | slot | list | root | `main` | 详情页标题旁标签，在版本/beta/问题标签之后。 | id*, order?, label? | — | — | none | — | — |
| `plugins.detail.section` | slot | list | root | `main` | 详情页自有内容之下的区块。 | id*, order?, label? | — | — | none | — | — |

### 2.6 conversation 外壳 / header（8）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `main.conversation` | slot | single | session-maybe | `main` | main 面板入口之下的会话壳。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.header` | slot | single | session-maybe | `main.conversation` | 常驻导航容器，无 Session 被选中时也在。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.header.leading` | slot | single | root | `conversation.header` | Session 标题前的全局导航，无 Session 也可用。 | — | — | — | none | — | — |
| `conversation.session.header` | slot | single | session | `conversation.header` | 严格按 Session 的标题、动作与 View 导航。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.session.header.utilities` | slot | list | session | `conversation.session.header` | 右对齐的 Session 工具项，按 `order` 升序。 | id*, order?, label? | —（标准 props） | — | none | — | ✅ `api-gallery-header` |
| `conversation.session.header.corner` | slot | single | session | `conversation.session.header` | header 最右角，utilities 边缘之后、进入 header padding，供一个控件。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.session.header.actions` | slot | list | session | `conversation.session.header` | 标题旁的 Session 动作，按 `order` 升序。 | id*, order?, label? | — | — | none | — | — |
| `conversation.session.header.lineage` | slot | single | session | `conversation.session.header` | 可选，替换某条 Session 面包屑标题。 | — | — | — | shadows-shipped-ui | — | — |

### 2.7 conversation view / chat（11）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `conversation.session` | slot | single | session | `conversation.content` | 严格按 Session 的会话主体。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.view` | slot | list | session | `conversation.session` | 注册的 Conversation target Views，一次渲染一个。 | id*, order?, label? | `inspectCall / viewRequest / openView / completeViewRequest` | — | none | — | ✅ `api-gallery-view` |
| `conversation.trajectory.images` | slot | single | session | `conversation.view` | Trajectory 账本中一组持久 record 图片的渲染器。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.chat.flow` | slot | single | session | `conversation.view` | 有序 Chat 行与本地 echo，带视口可见性 hook。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.chat.node` | slot | keyed | session | `conversation.chat.flow` | 最终 Chat 节点渲染器，按 `ChatNodeKind` keyed。 | key* | — | fixed：ChatNodeKind（已占 19） | shadows-shipped-ui | — | — |
| `conversation.chat.message.images` | slot | single | session | `conversation.chat.node` | 一组连续持久消息图片的渲染器。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.chat.assistant-actions` | slot | list | session | `conversation.chat.node` | 单条 finalized assistant 消息的有序动作。 | id*, order?, label? | `{ messageId }` | — | none | — | ✅ `api-gallery-assistant` |
| `conversation.chat.reasoning.body` | slot | single | session | `conversation.chat.node` | 展开的 reasoning 正文（模型原文不变）。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.chat.commandview` | slot | keyed | session | `conversation.chat.node` | 按命令名 keyed 的 command 行。 | key* | — | open（空） | none | — | — |
| `conversation.chat.turnTail` | slot | list | session | `conversation.chat.node` | 完成 Turn 的 action row 之前的有序特性贡献。 | id*, order?, label? | `{ turn, seq, openFile }` | — | none | — | ✅ `api-gallery-turn-tail` |
| `deliverables.file.actions` | slot | list | session | `conversation.chat.turnTail` | 通过其授权的 Session event 坐标打开一个文件。 | id*, order?, label? | — | — | none | — | — |

### 2.8 conversation composer（15）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `conversation.composer` | slot | chain | session | `conversation.content` | 当前 Session 常驻 composer 的 selector 路由替换。 | select* | — | — | none | — | — |
| `conversation.approval.detail` | slot | single | session | `conversation.composer` | 与 approval 请求关联的 Tool call 的可选详情。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.plan-review.actions` | slot | list | session | `conversation.composer` | 正在 review 的 plan 的动作；approval 仍由 question composer 负责。 | id*, order?, label? | — | — | none | — | — |
| `conversation.composer.bar` | slot | single | session-maybe | `conversation.content` | 常驻 composer 主体，含无 Session 惰性态。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.input.attachments` | slot | single | session-maybe | `conversation.composer.bar` | 可选草稿附件栏与 drop target。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.input.overlay` | slot | list | session | `conversation.composer.bar` | 常驻 composer 卡内的浮动条目。 | id*, order?, label? | — | — | none | — | — |
| `conversation.input.permission` | slot | single | session | `conversation.composer.bar` | composer 工具行内当前 Session 的权限控件。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.input.model` | slot | single | session | `conversation.composer.bar` | composer 工具行内的模型选择器。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.input.model.label` | slot | single | session | `conversation.input.model` | 非交互内联模型标签；选择控件仍由 owner 管理。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.input.left` | slot | list | session | `conversation.composer.bar` | composer 工具行左侧的紧凑控件。 | id*, order?, label? | —（标准 props） | — | none | — | ✅ `api-gallery-input-left` |
| `conversation.input.plan` | slot | single | session | `conversation.composer.bar` | composer 工具行内的 Plan 控件。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.input.right` | slot | list | session | `conversation.composer.bar` | composer 提交动作之前的紧凑控件。 | id*, order?, label? | —（标准 props） | — | none | — | ✅ `api-gallery-input-right` |
| `conversation.input.activity` | slot | single | session | `conversation.composer.bar` | 模型选择器之后的紧凑 action，可横跨工具条展开。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.composer.dock` | slot | list | session | `conversation.composer.bar` | composer 卡下方的 ambient 条目。 | id*, order?, label? | —（标准 props） | — | none | — | ✅ `api-gallery-dock` |
| `conversation.input.dock` | slot | list | session | `conversation.content` | composer 卡上方的通栏条目。 | id*, order?, label? | — | — | none | — | — |

### 2.9 conversation hero（5）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `conversation.hero.workspace` | slot | single | root | `conversation.content` | 空白 Session Hero 显示的工作区选择器。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.hero.workspace.directoryFlow` | slot | single | root | `conversation.hero.workspace` | conversation 空状态选择器下方的目录流洞（WorkspacePicker 声明）。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.hero.brand.mark` | slot | single | root | `conversation.content` | 空白 Session 标题前的品牌标记。 | — | — | — | none | — | — |
| `conversation.hero.agentPreset` | slot | single | session-maybe | `conversation.content` | 为 New Session 预备的 agent preset 控件。 | — | — | — | shadows-shipped-ui | — | — |
| `conversation.hero.options` | slot | list | session | `conversation.content` | New Session 行中 workspace/preset 控件之后右对齐的紧凑选项。 | id*, order?, label? | —（标准 props） | — | none | — | ✅ `api-gallery-hero` |

### 2.10 conversation 用户文本 / 图片（2）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `conversation.user.text.node` | slot | keyed | session | `conversation.user.text` | 业务自有的纯 JSON 文本节点内联渲染器。 | key* | — | fixed：UserTextId（已占 7） | shadows-shipped-ui | — | — |
| `conversation.chat.user.images` | slot | single | session | `conversation.chat.user.content` | 用户消息图片，含 pending 与 local-echo 预览。 | — | — | — | shadows-shipped-ui | — | — |

### 2.11 右侧栏 / right sidebar（15）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `rightbar` | slot | single | root | `root` | 右列：中央为其让出的轨道，或什么都没有。 | — | — | — | shadows-shipped-ui | — | — |
| `rightbar.session` | slot | single | session | `rightbar` | 由 root 级右侧栏 controller 选择的 Session 内容。 | — | — | — | shadows-shipped-ui | — | — |
| `sidebar.right.pane.tab` | slot | keyed | session | `rightbar.session` | 一个 tab 的 body，按当前 `tab.kind` 对应 type 的 id 派发。 | key* | `useTabInfo() → { sidebar, panel, tab }` | open（空） | none | — | ✅ `api-gallery:right-tab` |
| `sidebar.right.tab.files.actions` | slot | list | session | `sidebar.right.pane.tab` | 文件树 reload 控件之后的工作区目录动作。 | id*, order?, label? | — | — | none | — | — |
| `sidebar.right.tab.document.actions` | slot | list | session | `sidebar.right.pane.tab` | 预览文件上的 header 工具栏贡献，渲染在预览控件之后。 | id*, order?, label? | — | — | none | — | — |
| `sidebar.right.tab.document.unpreviewable` | slot | list | session | `sidebar.right.pane.tab` | 文件无法渲染时的空态贡献，位于 Retry 位置。 | id*, order?, label? | — | — | none | — | — |
| `deliverables.review.file.actions` | slot | list | session | `sidebar.right.pane.tab` | 变更文件 review tab 拥有的同组文件动作。 | id*, order?, label? | — | — | none | — | — |
| `sidebar.right.tab.guide.entry` | slot | keyed | session | `sidebar.right.pane.tab` | 某个 provider 的 guide 卡，标准卡为 owner fallback。 | key* | — | open（空） | none | — | — |
| `sidebar.right.tab.guide` | slot | chain | session | `sidebar.right.pane.tab` | guide tab 的 body。 | select* | — | — | none | — | — |
| `sidebar.chat.conversation` | slot | single | session | `sidebar.right.pane.tab` | 某个 Sidebar chat tab 承载的 Session 级 Conversation。 | — | — | — | shadows-shipped-ui | — | — |
| `sidebar.right.tab.document` | slot | keyed | session | `sidebar.right.pane.tab` | 按已注册实现 id 选择的 document body。 | key* | — | open（空） | none | — | — |
| `sidebar.right.tab.document.office.pdf` | slot | keyed | session | `sidebar.right.tab.document` | 用 Office 自有转换字节提供的 PDF 呈现。 | key* | — | open（空） | none | — | — |
| `sidebar.right.tab.document.action` | slot | keyed | session | `sidebar.right.pane.tab` | document 工具栏 reload 之前的 renderer 专属控件。 | key* | — | open（空） | none | — | — |
| `sidebar.right.pane.tab.title` | slot | keyed | session | `rightbar.session` | tab 标题（chip 与浮动面板 header），同一 key + info hook。 | key* | — | open（空） | none | — | — |
| `sidebar.right.tab.menu.item` | slot | list | session | `rightbar.session` | 某个 tab 动作菜单末尾的额外项，按注册顺序。 | id*, order?, label? | — | — | none | — | — |

### 2.12 tool views（3）

| Slot | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tool.call.toolview` | slot | keyed | session | `conversation.chat.node` | 按 wire Tool 名派发的 Tool call view。 | key* | — | open（已占 54） | shadows-shipped-ui | — | — |
| `tool.call.images` | slot | single | session | `tool.call.toolview` | 已结算的含图 Tool call 的持久图片，经 attachment presentation 渲染。 | — | — | — | shadows-shipped-ui | — | — |
| `tool.view.cordis` | slot | keyed | session | `tool.call.toolview` | 最新合格 `cordis_run` 卡内由 Package 拥有的交互区域。 | key* | — | fixed：`allowedKeys` 仅 `self`（Guard 绑定） | none | — | — |

### 2.13 factories（6，不是注册点）

| Factory | type | kind | scope | parent | 用途 | 注册 | ownerProps | keyDomain | replaceRisk | occupants | 本插件已实现? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `conversation.images.content` | factory | factory | root | —（树根） | —（快照未提供） | — | — | — | — | — | — |
| `workspace.toast.content` | factory | factory | root | —（树根） | —（快照未提供） | — | — | — | — | — | — |
| `conversation.user.text` | factory | factory | session | —（树根） | —（快照未提供） | — | — | — | — | — | — |
| `conversation.content` | factory | factory | session-maybe | —（树根） | —（快照未提供） | — | — | — | — | — | — |
| `conversation.chat.reasoning.content` | factory | factory | root | —（树根） | —（快照未提供） | — | — | — | — | — | — |
| `conversation.chat.user.content` | factory | factory | session | —（树根） | —（快照未提供） | — | — | — | — | — | — |

---

## 3. 本插件（dsh-plugin-api-gallery）已实现对照

15 个 Slot 注册（14 个 list + 1 个 keyed body），另有 1 个原生右侧栏 type registry 与 1 个 commandUi action（两者都**不是** Slot）。

| # | Slot | 本插件 id | kind / 方式 | 位置 | 状态 |
| ---: | --- | --- | --- | --- | --- |
| 1 | `conversation.view` | `api-gallery-view` | list / 新 id | 会话 View 标签栏 | 既有确认 active |
| 2 | `conversation.session.header.utilities` | `api-gallery-header` | list / 新 id | 会话右上角工具区 | 既有确认 active |
| 3 | `conversation.composer.dock` | `api-gallery-dock` | list / 新 id | 输入框下方 | 既有确认 active |
| 4 | `conversation.input.left` | `api-gallery-input-left` | list / 新 id | composer 工具行左侧 | 既有确认 active |
| 5 | `conversation.input.right` | `api-gallery-input-right` | list / 新 id | 提交按钮前 | 既有确认 active |
| 6 | `conversation.chat.assistant-actions` | `api-gallery-assistant` | list / 新 id | finalized assistant 消息旁 | 既有确认 active |
| 7 | `conversation.chat.turnTail` | `api-gallery-turn-tail` | list / 新 id | 完成 Turn 的 action row 之前 | 既有确认 active |
| 8 | `sidebar.session.row.leading` | `api-gallery-session-row` | list / 新 id | idle Session 行最前 16px | 既有确认 active |
| 9 | `sidebar.footer.action` | `api-gallery-footer` | list / 新 id | 侧栏底部 Settings 旁 | 既有确认 active |
| 10 | `settings.section` | `api-gallery-settings` | list / 新 id | Settings 左侧导航整页 | 既有确认 active |
| 11 | `settings.general.item` | `api-gallery-general` | list / 新 id | Settings → General 偏好行 | 既有确认 active |
| 12 | `settings.plugins.tab` | `api-gallery-plugins-tab` | list / 新 id | Settings → Plugins tab | 既有确认 active |
| 13 | `shell.overlay` | `api-gallery-overlay` | list / 新 id | 全屏浮层（详情弹层 + Toast） | 既有确认 active |
| 14 | `conversation.hero.options` | `api-gallery-hero` | list / 新 id | New Session Hero 右侧选项 | 既有确认 active |
| 15 | `sidebar.right.pane.tab` | `api-gallery:right-tab` | keyed / body key | 原生右侧栏 tab body | 既有确认 active |
| — | `sidebarRightTabs.register` | `api-gallery:right-tab`（kind `api-gallery-demo`） | Client Service registry，**不是 Slot** | 右侧栏 tab 列表/guide | 既有确认已注册 |
| — | `commandUi.register` | `api-gallery-demo`（`ui.kind: 'action'`） | Client Service，**不是 Slot** | composer “+” / “/” 菜单 | 既有确认已注册 |

> 「既有确认」指 `docs/slot-demos.md` 记录的此前后端 active 状态；本次实时 `Slots.listSubTree` 全部超时，未能重新复核（见 §6）。本插件未占用任何 single Slot、fixed-key 或 chain Slot。

---

## 4. 增量注册候选

判定：接受 fresh `id`（list）或 open keyDomain 的 fresh `key`，且不属 single / fixed-key。按此**结构口径**候选为 **37 + 13 = 50**。
保守口径：剔除 key 只能由 owner 自身注册表派发、公开目录看不到通用注册入口的 7 个 open-keyed，得到 **37 + 6 = 43**（其中 `main` 需配合 `sidebar.panellist` 的 id 与 main key 对齐，属推断）。

### 4.1 list：接受 fresh id（37）

| Slot | parent | 落点 |
| --- | --- | --- |
| `shell.overlay` | `root` | 框架浮层 |
| `settings.section` | `sidebar.settings` | 设置整页 |
| `settings.general.item` | `settings.section` | General 偏好行 |
| `settings.plugins.tab` | `settings.section` | Plugins 设置页 |
| `settings.models.footer` | `settings.section` | 模型设置 footer |
| `settings.action` | `sidebar.settings` | 设置 header 动作 |
| `settings.onboarding` | `sidebar.settings` | onboarding 步骤 |
| `sidebar.footer.action` | `sidebar` | 侧栏底部动作 |
| `sidebar.panellist` | `sidebar` | 全局面板图标 |
| `sidebar.workspaces.session.menu.item` | `sidebar.workspaces` | Session “...” 菜单行 |
| `sidebar.workspaces.session.row.action` | `sidebar.workspaces` | Session 行悬停按钮 |
| `sidebar.session.row.leading` | `sidebar.workspaces` | Session 行前导徽标 |
| `sidebar.session.row.hover` | `sidebar.workspaces` | Session hover 卡段 |
| `plugins.add.actions` | `main` | Plugins 安装后动作行 |
| `plugins.tab` | `main` | Plugins 页 tab |
| `plugins.item` | `main` | 官方 plugin 卡片 |
| `plugins.detail.actions` | `main` | 详情页头部控件 |
| `plugins.detail.badge` | `main` | 详情页标题标签 |
| `plugins.detail.section` | `main` | 详情页区块 |
| `conversation.session.header.utilities` | `conversation.session.header` | 会话右上角工具 |
| `conversation.session.header.actions` | `conversation.session.header` | 标题旁动作 |
| `sidebar.right.tab.files.actions` | `sidebar.right.pane.tab` | 文件树动作 |
| `sidebar.right.tab.document.actions` | `sidebar.right.pane.tab` | 文档工具栏 |
| `sidebar.right.tab.document.unpreviewable` | `sidebar.right.pane.tab` | 不可预览空态 |
| `deliverables.review.file.actions` | `sidebar.right.pane.tab` | review 文件动作 |
| `sidebar.right.tab.menu.item` | `rightbar.session` | tab 菜单项 |
| `conversation.plan-review.actions` | `conversation.composer` | plan review 动作 |
| `conversation.view` | `conversation.session` | Conversation View |
| `conversation.chat.assistant-actions` | `conversation.chat.node` | assistant 消息动作 |
| `conversation.chat.turnTail` | `conversation.chat.node` | Turn 尾行 |
| `deliverables.file.actions` | `conversation.chat.turnTail` | 打开文件动作 |
| `conversation.input.overlay` | `conversation.composer.bar` | composer 浮动条目 |
| `conversation.input.left` | `conversation.composer.bar` | composer 左控件 |
| `conversation.input.right` | `conversation.composer.bar` | composer 右控件 |
| `conversation.composer.dock` | `conversation.composer.bar` | composer 下方条目 |
| `conversation.input.dock` | `conversation.content` | composer 上方条目 |
| `conversation.hero.options` | `conversation.content` | New Session 右侧选项 |

### 4.2 keyed：open keyDomain（13）

| Slot | 已占 key | 可达性 | replaceRisk | 备注 |
| --- | ---: | --- | --- | --- |
| `settings.models.provider-card` | 0 | owner-dispatch-only | none | key = `settingsNs`，仅模型 provider |
| `main` | 1（conversation） | 配合 `sidebar.panellist`（推断） | shadows-shipped-ui | fresh key = 新面板 id；复用内置 key 会替换 |
| `plugins.bundle.config` | 2 | owner-dispatch-only | shadows-shipped-ui | key = bundle 包名（bundle 可命中自身） |
| `plugins.bundle.activation` | 1 | owner-dispatch-only | shadows-shipped-ui | key = npm 包名 |
| `plugins.row.config` | 0 | owner-dispatch-only | none | key = `<包名>#<row id>`（bundle 自声明） |
| `sidebar.right.pane.tab` | 0 | 需 `sidebarRightTabs.register`（已文档化） | none | key = tab type id，两段式注册 |
| `sidebar.right.pane.tab.title` | 0 | 需 `sidebarRightTabs.register`（已文档化） | none | 与 body 同 key |
| `sidebar.right.tab.guide.entry` | 0 | 需 `sidebarRightTabs.register` 的 guide（已文档化） | none | provider guide 卡 |
| `sidebar.right.tab.document` | 0 | owner-dispatch-only | none | key = 已注册 document 实现 id |
| `sidebar.right.tab.document.office.pdf` | 0 | owner-dispatch-only | none | Office 转换字节专用 |
| `sidebar.right.tab.document.action` | 0 | owner-dispatch-only | none | renderer 专属控件 |
| `tool.call.toolview` | 54 | 自有 tool 名即可 | shadows-shipped-ui | 复用内置 tool 名会替换其 UI |
| `conversation.chat.commandview` | 0 | 自有 command 名即可 | none | — |

**保守候选 = 43**：4.1 全部 37 + 4.2 中 `main`、`sidebar.right.pane.tab`、`sidebar.right.pane.tab.title`、`sidebar.right.tab.guide.entry`、`tool.call.toolview`、`conversation.chat.commandview` 共 6 个。4.2 其余 7 个计入 §5.5。

---

## 5. 不可增量 / 会替换内置 UI（保守口径 57）

### 5.1 single：owner 只渲染一个节点（43）

single 无法追加，注册即替换该节点的内容；其中 41 个 `replaceRisk=shadows-shipped-ui`，2 个为 `none`（`conversation.header.leading`、`conversation.hero.brand.mark`，仍不可增量）。

| 区域 | Slots | 原因 |
| --- | --- | --- |
| root/frame | `root`, `shell.bottom`, `shell.leading` | 单节点，注册即替换框架结构 |
| sidebar | `sidebar`, `sidebar.brand.mark`, `sidebar.brand.name`, `sidebar.toggle.badge`, `sidebar.settings` | 单节点，替换侧栏/品牌/设置座位 |
| workspaces | `sidebar.workspaces`, `sidebar.workspaces.directoryFlow` | 单节点，替换浏览区 |
| settings | `settings.trigger`, `settings.header`, `settings.close`, `settings.models.sign-in`, `settings.launcher` | 单节点，替换设置 chrome/登录位 |
| conversation 外壳/header | `main.conversation`, `conversation.header`, `conversation.header.leading`, `conversation.session.header`, `conversation.session.header.corner`, `conversation.session.header.lineage` | 单节点，替换会话壳/header 位 |
| conversation view/chat | `conversation.session`, `conversation.trajectory.images`, `conversation.chat.flow`, `conversation.chat.message.images`, `conversation.chat.reasoning.body` | 单节点，替换主体/渲染器 |
| composer | `conversation.approval.detail`, `conversation.composer.bar`, `conversation.input.attachments`, `conversation.input.permission`, `conversation.input.model`, `conversation.input.model.label`, `conversation.input.plan`, `conversation.input.activity` | 单节点，替换 composer 或其控件 |
| hero | `conversation.hero.workspace`, `conversation.hero.workspace.directoryFlow`, `conversation.hero.brand.mark`, `conversation.hero.agentPreset` | 单节点，替换 Hero 位 |
| 用户文本/图片 | `conversation.chat.user.images` | 单节点，替换用户图片渲染 |
| right sidebar | `rightbar`, `rightbar.session`, `sidebar.chat.conversation` | 单节点，替换右列/会话承载 |
| tool views | `tool.call.images` | 单节点，替换含图 tool 呈现 |

### 5.2 chain：selector 路由替换（3）

不是追加 id，而是由 `select(owner) => unknown | null` 选择替换项；注册会与 owner 的内置链竞争。

| Slot | 原因 |
| --- | --- |
| `shell.quota-notice` | 配额提示链，select 命中即替换 |
| `sidebar.right.tab.guide` | guide tab body，select 命中即替换 |
| `conversation.composer` | 当前 Session 常驻 composer 的 selector 路由替换 |

### 5.3 fixed-key keyed（4）

key 集合由 owner 键表 / Client Guard 固定，不能新增 key。

| Slot | keyDomain | 已占 |
| --- | --- | ---: |
| `workspace.toast` | ToastKind | 11 |
| `conversation.user.text.node` | UserTextId | 7 |
| `conversation.chat.node` | ChatNodeKind | 19 |
| `tool.view.cordis` | `allowedKeys` 仅 `self`，Guard 绑定 pluginId/packageId | 1（self） |

### 5.4 replaceRisk = shadows-shipped-ui（48）

复用内置 id/key 会替换内置 UI；新 id/key 通常仍是增量。构成：41 个 single（见 §5.1）+ 7 个 keyed —— `workspace.toast`、`main`、`plugins.bundle.config`、`plugins.bundle.activation`、`conversation.user.text.node`、`conversation.chat.node`、`tool.call.toolview`。其中 fixed-key 的 3 个（`workspace.toast`、`conversation.user.text.node`、`conversation.chat.node`）完全不可新增；`main` / `tool.call.toolview` 用 fresh key 安全；`plugins.bundle.*` 见 §5.5。

### 5.5 owner-dispatch-only open key（7）

keyDomain 标注 open，但 key 由 owner 自身注册表派发，公开目录未列出通用注册入口（保守按不可增量计）：

| Slot | 原因 |
| --- | --- |
| `settings.models.provider-card` | 仅随模型 provider 卡派发（`settingsNs`） |
| `plugins.bundle.config` | 仅 bundle 包名；本插件可命中自身，但不是通用扩展点 |
| `plugins.bundle.activation` | 仅 npm 包名 |
| `plugins.row.config` | 仅 bundle patch 声明的 `<包名>#<row id>` |
| `sidebar.right.tab.document` | 仅已注册 document 实现 id |
| `sidebar.right.tab.document.office.pdf` | 仅 Office 转换字节路径 |
| `sidebar.right.tab.document.action` | 仅 document renderer 专属 |

### 5.6 计数口径

| 口径 | 可增量 | 不可增量 |
| --- | ---: | ---: |
| 结构口径（list + open-keyed） | 37 + 13 = **50** | 43 single + 3 chain + 4 fixed-keyed = **50** |
| 保守口径（剔除 owner-dispatch-only） | 37 + 6 = **43** | 43 + 3 + 4 + 7 = **57** |

---

## 6. 数据来源与失败查询

| 来源 | 内容 | 状态 |
| --- | --- | --- |
| `catalog.json` | 106 节点：name/type/kind/scope/purpose/replaceRisk/parent/registration/keyDomain/allowedKeys，meta `0.2.1-rc.2` / `2026-10-23` | 已用 |
| `.scan/client-Slots-listSubTree.full.json` | 无 root 的完整树（7 棵：1 Slot 根 + 6 Factory 根），字段与 catalog 一致；`referencedTypes` 为空数组 | 已用 |
| `docs/slot-demos.md` | 15 个 Slot 的 ownerProps、本插件 id、既有 active 记录；原生右侧栏两段式注册 | 已用 |
| `docs/interface-catalog.md` | 全量 Slot 表（与 catalog 同源）、已知边界 | 交叉核对 |
| live `cordis_inspect_query` client/Slots/listSubTree | 期望补充精确 detail + occupants | **全部失败** |
| live `cordis_inspect_query` client/Builtin/listBuiltins | 连通性对照 | **失败** |

失败的实时查询（均 `timed out after 10000ms`，已按“重试一次”执行并记录，未猜测）：

| # | 调用 | input | 结果 |
| ---: | --- | --- | --- |
| 1 | `client / Slots / listSubTree` | `{ "root": "conversation.view" }` | timeout |
| 2 | 同上（重试） | `{ "root": "conversation.view" }` | timeout |
| 3 | `client / Slots / listSubTree` | `{ "root": "shell.overlay" }` | timeout |
| 4 | `client / Slots / listSubTree` | `{}`（整树） | timeout |
| 5 | `client / Builtin / listBuiltins` | `{}`（连通性对照） | timeout |

**数据缺口（重要）**：
- `catalog.json` 与 `.scan` 原始树**均不含 `ownerProps`、`standardProps`、`occupants` 字段**（`scripts/build-catalog.cjs` 会透传 ownerProps/standardProps，但本快照未提供）。因此 §2 表中 ownerProps 只能填 `docs/slot-demos.md` 记录的 15 个；occupants 除本插件外无静态证据，统一记 `—`。
- “已实现”状态来自 `docs/slot-demos.md` 的既有确认，并非本次实时复核。
- 未做任何浏览器/像素级验证。

**观察**：`main`、`sidebar.right.pane.tab` 等 keyed Slot 的 keyDomain 文本只有 “open: any string the owner dispatches”，并未区分“可被外部新 key 命中”与“仅 owner 派发”；本文件因此拆成 §4.2 可达性列与 §5.5 owner-dispatch-only 两类，避免把结构性 open 误当成可用扩展点。`tool.call.toolview` 已占 54 个内置 tool 名，是 keyed 中占用最多的一个。
