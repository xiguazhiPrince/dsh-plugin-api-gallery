/* eslint-disable no-undef */
/**
 * Browser half of dsh-plugin-api-gallery.
 *
 * This is deliberately NOT one gallery page. Every demo lives in the Slot it
 * documents, and its title is `图鉴demo · <slot-key>`:
 *
 *   conversation.view                     a View tab beside Chat / Trajectory
 *   conversation.session.header.utilities  a button in the conversation header
 *   sidebarRightTabs.register + sidebar.right.pane.tab
 *                                          a tab in the native right sidebar
 *   conversation.composer.dock             a chip below the composer
 *   conversation.input.left / .right       compact controls in the composer
 *   conversation.chat.assistant-actions    an action on finalized messages
 *   conversation.chat.turnTail             a row after a completed Turn
 *   sidebar.session.row.leading            a 14px badge on Session rows
 *   sidebar.footer.action                  an action beside Settings
 *   settings.section                       a page in Settings
 *   settings.general.item                  a row in Settings → General
 *   settings.plugins.tab                   a tab in Settings → Plugins
 *   shell.overlay                          modal/toast surface + detail popup
 *   conversation.hero.options              an option in the New Session row
 *
 * Small controls open a shared detail modal rendered by shell.overlay. Larger
 * surfaces (View tab, Settings page, native right-sidebar tab) render the same
 * slot information inline.
 *
 * Round 2 (A-新增 18 + 安全 C 子集 6) adds 24 registrations on top of the 15
 * above. 20 list Slots are data-driven through GENERIC_SLOTS + GalleryEntry
 * (modes: button / icon-button / menu-item / row / badge / link / chip /
 * inline); 3 are bespoke (plugins.tab, plugins.detail.section,
 * sidebar.right.pane.tab.title); the keyed guide card uses the same
 * `api-gallery:right-tab` key. Every generic entry opens the shared
 * shell.overlay detail with its META code; unknown owner props are ignored and
 * never call openFile or other side effects.
 */
window.__ModuleLoader__.load({
  id: 'dsh-plugin-api-gallery',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect } = React;

    const PLUGIN_ID = 'dsh-plugin-api-gallery';
    const ROUTE = 'plugin-api-gallery';
    const RIGHT_TAB_ID = 'api-gallery:right-tab';
    const RIGHT_TAB_KIND = 'api-gallery-demo';
    const COMMAND_UI = 'commandUi.register';

    let runtime = null;

    const SLOT = {
      view: 'conversation.view',
      header: 'conversation.session.header.utilities',
      rightTab: 'sidebarRightTabs.register',
      dock: 'conversation.composer.dock',
      inputLeft: 'conversation.input.left',
      inputRight: 'conversation.input.right',
      assistant: 'conversation.chat.assistant-actions',
      turnTail: 'conversation.chat.turnTail',
      sessionRow: 'sidebar.session.row.leading',
      footer: 'sidebar.footer.action',
      settings: 'settings.section',
      general: 'settings.general.item',
      pluginsTab: 'settings.plugins.tab',
      overlay: 'shell.overlay',
      hero: 'conversation.hero.options',
      main: 'main',
      panelList: 'sidebar.panellist',
      toolView: 'tool.call.toolview',
      commandView: 'conversation.chat.commandview',
    };

    const OPEN_IDS = {
      view: 'api-gallery-view',
      header: 'api-gallery-header',
      dock: 'api-gallery-dock',
      inputLeft: 'api-gallery-input-left',
      inputRight: 'api-gallery-input-right',
      assistant: 'api-gallery-assistant',
      turnTail: 'api-gallery-turn-tail',
      sessionRow: 'api-gallery-session-row',
      footer: 'api-gallery-footer',
      settings: 'api-gallery-settings',
      general: 'api-gallery-general',
      pluginsTab: 'api-gallery-plugins-tab',
      overlay: 'api-gallery-overlay',
      hero: 'api-gallery-hero',
      panel: 'api-gallery-panel',
    };

    // ---------------------------------------------------------------------
    // A-新增 18 + 安全 C 子集：data-driven list Slots.
    //
    // Every entry is additive by construction (kind=list, new `api-gallery-*`
    // id). 4 of the 18 A items are bespoke and live outside this table:
    // plugins.tab / plugins.detail.section / sidebar.right.pane.tab.title
    // (keyed) / sidebar.right.tab.guide.entry (keyed). See `apply`.
    //
    // `id` is filled in below as `api-gallery-<slug>` before META is built.
    // `order` follows docs/slot-classification.md §2.2.
    // ---------------------------------------------------------------------
    const GENERIC_SLOTS = [
      // ---- A-新增 18 中可用一个通用组件覆盖的 15 项 ----
      {
        slot: 'settings.models.footer',
        slug: 'models-footer',
        mode: 'row',
        order: 50,
        scope: 'root',
        desc: 'Settings → Models 里 provider 行与 add 控件之后的有序扩展区。本示例追加一行说明 + 详情入口，不读取任何 provider 数据。',
      },
      {
        slot: 'settings.action',
        slug: 'settings-action',
        mode: 'button',
        order: 50,
        scope: 'root',
        desc: '设置内容列 header 中、Close 之前的可选动作。本示例放一个紧凑的「图鉴」按钮，点击只开详情弹层。',
      },
      {
        slot: 'sidebar.workspaces.session.menu.item',
        slug: 'session-menu',
        mode: 'menu-item',
        order: 60,
        scope: 'root',
        desc: '侧栏某个 Session “...” 菜单里按 order 追加的一行。菜单上下文未知，owner props 一律按 undefined 防御。',
      },
      {
        slot: 'sidebar.workspaces.session.row.action',
        slug: 'session-row-action',
        mode: 'icon-button',
        order: 60,
        scope: 'root',
        desc: 'Session 行末尾、排在 “...” 触发器之后的悬停按钮。可能需要 hover 行才出现。',
      },
      {
        slot: 'sidebar.session.row.hover',
        slug: 'session-hover',
        mode: 'row',
        order: 50,
        scope: 'root',
        desc: 'Session 行 hover 卡中相对时间与尾部状态行之间的一段；只画一行静态说明。',
      },
      {
        slot: 'plugins.item',
        slug: 'plugin-item',
        mode: 'row',
        order: 60,
        scope: 'root',
        desc: 'Settings → Plugins 官方 plugin 列表中 official bundles 之后追加的一项；本示例是一张最小的 plugin 行。',
      },
      {
        slot: 'plugins.detail.actions',
        slug: 'detail-actions',
        mode: 'button',
        order: 50,
        scope: 'root',
        desc: 'Plugins 详情页头部、页面自带 switch/uninstall 之前的控件；详情页 subject 未知，不读取。',
      },
      {
        slot: 'plugins.detail.badge',
        slug: 'detail-badge',
        mode: 'badge',
        order: 50,
        scope: 'root',
        desc: 'Plugins 详情页标题旁、版本/beta/问题标签之后追加的标签。',
      },
      {
        slot: 'conversation.session.header.actions',
        slug: 'header-actions',
        mode: 'button',
        order: 50,
        scope: 'session',
        desc: '会话标题旁的 Session 动作区，按 order 追加；比 header.utilities 更靠标题。',
      },
      {
        slot: 'sidebar.right.tab.files.actions',
        slug: 'files-actions',
        mode: 'icon-button',
        order: 50,
        scope: 'session',
        desc: '右侧栏 Files tab 文件树 reload 控件之后的工作区目录动作；文件树上下文未知，不读取。',
      },
      {
        slot: 'sidebar.right.tab.document.actions',
        slug: 'document-actions',
        mode: 'button',
        order: 50,
        scope: 'session',
        desc: '右侧栏文档预览 header 工具栏、预览控件之后的贡献。本示例不调用 openFile，也不碰任何 path。',
      },
      {
        slot: 'sidebar.right.tab.menu.item',
        slug: 'right-menu',
        mode: 'menu-item',
        order: 60,
        scope: 'session',
        desc: '右侧栏某个 tab 动作菜单末尾追加的一行；tab 菜单上下文未知，按 undefined 防御。',
      },
      {
        slot: 'deliverables.file.actions',
        slug: 'file-actions',
        mode: 'link',
        order: 50,
        scope: 'session',
        desc: '完成 Turn 的尾行里追加一个「打开授权文件」动作。本示例只打开详情弹层，绝不调用 openFile。',
      },
      {
        slot: 'conversation.input.overlay',
        slug: 'input-overlay',
        mode: 'chip',
        order: 50,
        scope: 'session',
        desc: 'composer 卡内常驻的浮动条目；本示例是一个小 chip，点击开详情。',
      },
      {
        slot: 'conversation.input.dock',
        slug: 'input-dock',
        mode: 'row',
        order: 50,
        scope: 'session',
        desc: 'composer 卡上方的通栏条目；本示例是一行「图鉴demo」条。',
      },

      // ---- 安全 C 子集：5 个 list（全部 additive，仅状态少见） ----
      {
        slot: 'settings.onboarding',
        slug: 'onboarding',
        mode: 'inline',
        order: 50,
        scope: 'root',
        desc: 'settings 特性在 onboarding 流程中的 root 级步骤。只有引导流程挂载时才渲染；未挂载时由 slots.inject 等待（待挂载验证）。',
      },
      {
        slot: 'plugins.add.actions',
        slug: 'plugins-add-actions',
        mode: 'row',
        order: 50,
        scope: 'root',
        desc: 'bundle 安装完成后追加的 MenuItemButton 行（标题 + 两行描述）。只有安装状态出现（待挂载验证）。',
      },
      {
        slot: 'sidebar.right.tab.document.unpreviewable',
        slug: 'document-unpreviewable',
        mode: 'row',
        order: 50,
        scope: 'session',
        desc: '文件无法预览时的空态贡献，位于 Retry 位置。只有打开不可渲染文件时出现（待挂载验证）。',
      },
      {
        slot: 'deliverables.review.file.actions',
        slug: 'review-file-actions',
        mode: 'link',
        order: 50,
        scope: 'session',
        desc: '变更文件 review tab 拥有的同组文件动作。只有 review 工作流存在时出现（待挂载验证）。',
      },
      {
        // 任务文本写 conversation.composer.plan-review.actions；census /
        // classification 的实时 key 是 conversation.plan-review.actions，
        // 以 census 为准注册真实 key。
        slot: 'conversation.plan-review.actions',
        slug: 'plan-review-actions',
        mode: 'button',
        order: 50,
        scope: 'session',
        desc: 'plan 正在 review 时的动作；只有该瞬时状态出现（待挂载验证）。approval 仍由 question composer 负责。',
      },
    ];

    function slotTitle(key) {
      return `图鉴demo · ${key}`;
    }

    function shortSlot(key) {
      const parts = key.split('.');
      return parts.length > 1 ? parts.slice(-2).join('.') : key;
    }

    function shortId(id) {
      if (typeof id !== 'string') return String(id ?? '');
      return id.length > 24 ? `${id.slice(0, 21)}…` : id;
    }

    function errorText(error) {
      if (error === null || error === undefined) return '';
      return error.message ? String(error.message) : String(error);
    }

    function meta(key, id, kind, scope, desc, label = true) {
      const lines = [
        `ctx.slots.inject('${key}', () => ctx.slots.register({`,
        `  name: '${key}',`,
        `  id: '${id}',`,
        `  order: 50,`,
      ];
      if (label) lines.push(`  label: () => '${slotTitle(key)}',`);
      lines.push('}, Demo))');
      return { key, id, kind, scope, desc, label, code: lines.join('\n') };
    }

    // Code string for one data-driven list entry (GENERIC_SLOTS).
    function genericMeta(entry) {
      const lines = [
        `ctx.slots.inject('${entry.slot}', () => ctx.slots.register({`,
        `  name: '${entry.slot}',`,
        `  id: '${entry.id}',`,
        `  order: ${entry.order},`,
        `  label: () => '${slotTitle(entry.slot)}',`,
        '}, GalleryEntry))',
      ];
      return {
        key: entry.slot,
        id: entry.id,
        kind: 'list',
        scope: entry.scope,
        mode: entry.mode,
        desc: entry.desc,
        label: true,
        code: lines.join('\n'),
      };
    }

    // Code string for one bespoke list registration.
    function listMeta(slot, id, order, scope, desc, component) {
      const lines = [
        `ctx.slots.inject('${slot}', () => ctx.slots.register({`,
        `  name: '${slot}',`,
        `  id: '${id}',`,
        `  order: ${order},`,
        `  label: () => '${slotTitle(slot)}',`,
        `}, ${component}))`,
      ];
      return { key: slot, id, kind: 'list', scope, desc, label: true, code: lines.join('\n') };
    }

    const META = {
      [SLOT.view]: meta(SLOT.view, OPEN_IDS.view, 'list', 'session', '在会话顶部的 View 标签栏增加一个真实 tab；它和 Chat / Trajectory 并列，内容随 session 切换。'),
      [SLOT.header]: meta(SLOT.header, OPEN_IDS.header, 'list', 'session', '在会话右上角的工具区增加一个按钮；按钮本身是紧凑的，完整 slot 名在 tooltip 与详情弹层里。'),
      [SLOT.dock]: meta(SLOT.dock, OPEN_IDS.dock, 'list', 'session', '在输入框下方增加一个常驻 chip；点击打开该 slot 的详情弹层。'),
      [SLOT.inputLeft]: meta(SLOT.inputLeft, OPEN_IDS.inputLeft, 'list', 'session', '在 composer 工具行左侧增加一个紧凑按钮。'),
      [SLOT.inputRight]: meta(SLOT.inputRight, OPEN_IDS.inputRight, 'list', 'session', '在 composer 提交按钮之前增加一个紧凑按钮。'),
      [SLOT.assistant]: meta(SLOT.assistant, OPEN_IDS.assistant, 'list', 'session', '在每条已完成的 assistant 消息旁增加一个动作；owner props 会给出 messageId。'),
      [SLOT.turnTail]: meta(SLOT.turnTail, OPEN_IDS.turnTail, 'list', 'session', '在一轮完成后的 action row 之前增加一行；owner props 会给出 turn 与 seq。'),
      [SLOT.sessionRow]: meta(SLOT.sessionRow, OPEN_IDS.sessionRow, 'list', 'root', '在侧栏每个 Session 行的最前面占一个 16px 槽位；行处于 idle 状态时显示这个徽标。'),
      [SLOT.footer]: meta(SLOT.footer, OPEN_IDS.footer, 'list', 'root', '在侧栏底部 Settings 旁边增加一个动作；宽栏显示文字，窄栏显示图标。'),
      [SLOT.settings]: meta(SLOT.settings, OPEN_IDS.settings, 'list', 'root', '在 Settings 的左侧导航中增加一整页；这是全页面的 Slot。'),
      [SLOT.general]: meta(SLOT.general, OPEN_IDS.general, 'list', 'root', '在 Settings → General 的偏好行列表里增加一行；这个 Slot 不投影 label，行自己画标题、值和写入路径。', false),
      [SLOT.pluginsTab]: meta(SLOT.pluginsTab, OPEN_IDS.pluginsTab, 'list', 'root', '在 Settings → Plugins 的 tab 列表里增加一个 tab，与 Installed / Discover 并列。'),
      [SLOT.overlay]: meta(SLOT.overlay, OPEN_IDS.overlay, 'list', 'root', '全屏浮层 Slot。本插件把共享详情弹层与 Toast 都放在这里；所有小入口点击后都由它显示完整 slot 信息。', false),
      [SLOT.hero]: meta(SLOT.hero, OPEN_IDS.hero, 'list', 'session', '在 New Session 的 Hero 行右侧增加一个选项；只有存在 Session 时渲染。'),
    };

    META[SLOT.rightTab] = {
      key: SLOT.rightTab,
      id: RIGHT_TAB_ID,
      kind: 'tab type + keyed body',
      scope: 'session',
      desc: '在原生右侧栏（文件、终端那一列）增加一个 tab。tab 列表由 ctx.sidebarRightTabs.register 注册；tab 内容由 sidebar.right.pane.tab 这个 keyed Slot 渲染。',
      code: [
        "ctx.effect(() => ctx.sidebarRightTabs.register({",
        "  id: 'api-gallery:right-tab',",
        "  kind: 'api-gallery-demo',",
        "  priority: 'extension',",
        "  title: () => '图鉴demo · sidebarRightTabs.register',",
        "  guide: [{",
        "    id: 'demo',",
        "    order: 100,",
        "    title: () => '图鉴demo',",
        "    description: () => '原生右侧栏 tab：sidebarRightTabs.register + sidebar.right.pane.tab',",
        "  }],",
        "}))",
        "",
        "ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({",
        "  name: 'sidebar.right.pane.tab',",
        "  key: 'api-gallery:right-tab',",
        "}, RightTabDemo))",
      ].join('\n'),
    };

    META[COMMAND_UI] = {
      key: COMMAND_UI,
      id: 'api-gallery-command',
      kind: 'client service',
      scope: 'session',
      desc: 'composer 的 + 按钮和 / 菜单共用同一个候选列表。这里没有 Slot；扩展点是客户端服务 ctx.commandUi.register。注册一行 action 后，它会出现在「指令」分组（「添加」分组的内置行名是固定的）。',
      code: [
        "const commandUi = ctx.get('commandUi');",
        "if (commandUi !== undefined) {",
        "  ctx.effect(() => commandUi.register({",
        "    name: 'api-gallery-demo',",
        "    label: () => '图鉴demo · commandUi.register',",
        "    description: () => '客户端命令菜单扩展（不是 Slot）',",
        "    icon: GalleryMenuIcon,",
        "    available: () => true,",
        "    ui: {",
        "      kind: 'action',",
        "      run: () => openSlotDetail('commandUi.register'),",
        "    },",
        "  }))",
        "}",
      ].join('\n'),
    };

    // ---- A-新增 18 + 安全 C 子集 的 META（desc + 注册代码） --------------
    // 20 个 list 由 GENERIC_SLOTS 驱动（15 A + 5 C）。
    for (const entry of GENERIC_SLOTS) {
      entry.id = `api-gallery-${entry.slug}`;
      META[entry.slot] = genericMeta(entry);
    }

    // 3 个 bespoke + 1 个 keyed guide 卡。
    META['plugins.tab'] = listMeta(
      'plugins.tab',
      'api-gallery-plugins-page-tab',
      60,
      'root',
      'Settings → Plugins 页在 Installed / Discover 之后的 tab；页内复用 SlotPage 展示说明、注册代码与 Host 快照。',
      'PluginsTabDemo',
    );

    META['plugins.detail.section'] = listMeta(
      'plugins.detail.section',
      'api-gallery-detail-section',
      50,
      'root',
      'Plugins 详情页自有内容之下的区块；本示例是一块说明区 + 可复制的注册代码，不读取详情页 subject。',
      'PluginsDetailSectionDemo',
    );

    META['sidebar.right.pane.tab.title'] = {
      key: 'sidebar.right.pane.tab.title',
      id: RIGHT_TAB_ID,
      kind: 'keyed',
      scope: 'session',
      mode: 'chip',
      desc: 'key = 自家 tab type id，只绘制图鉴右栏 tab 的 chip 标题；与 body 共用同一 key，不存在替换内置 tab 标题的问题。',
      code: [
        "ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({",
        "  name: 'sidebar.right.pane.tab.title',",
        "  key: 'api-gallery:right-tab',",
        "}, PaneTabTitleDemo))",
      ].join('\n'),
    };

    META['sidebar.right.tab.guide.entry'] = {
      key: 'sidebar.right.tab.guide.entry',
      id: RIGHT_TAB_ID,
      kind: 'keyed',
      scope: 'session',
      mode: 'guide-card',
      desc: '图鉴右栏 tab 的 guide 卡（key = 自家 tab type id）；替换的只是本插件自己的 fallback 标准卡，不涉及内置 provider。',
      code: [
        "ctx.slots.inject('sidebar.right.tab.guide.entry', () => ctx.slots.register({",
        "  name: 'sidebar.right.tab.guide.entry',",
        "  key: 'api-gallery:right-tab',",
        "}, GuideEntryDemo))",
      ].join('\n'),
    };

    // Last two decision items: the main/panellist pair and the two keyed
    // chat views. They need a Host tool/command to be reachable, so the Host
    // half registers `api_gallery_demo` and `/api-gallery`.
    META[SLOT.main] = {
      key: SLOT.main,
      id: OPEN_IDS.panel,
      kind: 'keyed',
      scope: 'root',
      desc: '中央主面板 keyed slot。这个页面只由 sidebar.panellist 的图鉴demo 图标打开；它演示 main key 与图标 id 的对齐，不是接口总览页。',
      code: [
        "ctx.slots.inject('main', () => ctx.slots.register({",
        "  name: 'main',",
        "  key: 'api-gallery-panel',",
        "}, MainPanelDemo))",
      ].join('\n'),
    };

    META[SLOT.panelList] = {
      key: SLOT.panelList,
      id: OPEN_IDS.panel,
      kind: 'list',
      scope: 'root',
      desc: '侧栏全局面板图标；本示例的 id 与 main 的 key 都是 api-gallery-panel，所以点击图标会打开上面那个 main 页面。',
      code: [
        "ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({",
        "  name: 'sidebar.panellist',",
        "  id: 'api-gallery-panel',",
        "  order: 50,",
        "  label: () => '图鉴demo · sidebar.panellist',",
        "}, PanelIcon))",
      ].join('\n'),
    };

    META[SLOT.toolView] = {
      key: SLOT.toolView,
      id: 'api_gallery_demo',
      kind: 'keyed',
      scope: 'session',
      desc: '按 wire Tool 名派发的自定义工具卡片视图。Host 半注册 api_gallery_demo 工具后，调用它的卡片会渲染本示例视图；它只画一张说明卡，不改变工具结果。',
      code: [
        "ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({",
        "  name: 'tool.call.toolview',",
        "  key: 'api_gallery_demo',",
        "}, ToolViewDemo))",
      ].join('\n'),
    };

    META[SLOT.commandView] = {
      key: SLOT.commandView,
      id: 'api-gallery',
      kind: 'keyed',
      scope: 'session',
      desc: '按 command 名派发的自定义命令行视图。Host 半注册 /api-gallery 命令后，输入它会渲染本示例行；它只画说明和详情入口。',
      code: [
        "ctx.slots.inject('conversation.chat.commandview', () => ctx.slots.register({",
        "  name: 'conversation.chat.commandview',",
        "  key: 'api-gallery',",
        "}, CommandViewDemo))",
      ].join('\n'),
    };

    // ---------------------------------------------------------------------
    // Shared detail + toast stores. shell.overlay is both a demo and the
    // surface every small control uses to show the full slot information.
    // ---------------------------------------------------------------------
    let detailSeq = 0;
    let currentDetail = null;
    const detailSubs = new Set();

    function openSlotDetail(key, extra = null) {
      currentDetail = { id: ++detailSeq, key, extra };
      for (const listener of detailSubs) {
        try {
          listener(currentDetail);
        } catch {
          // ignore a broken listener
        }
      }
    }

    function closeSlotDetail() {
      currentDetail = null;
      for (const listener of detailSubs) {
        try {
          listener(null);
        } catch {
          // ignore
        }
      }
    }

    function useDetail() {
      const [detail, setDetail] = useState(currentDetail);
      useEffect(() => {
        const listener = (next) => setDetail(next);
        detailSubs.add(listener);
        return () => detailSubs.delete(listener);
      }, []);
      return detail;
    }

    let toastSeq = 0;
    let currentToast = null;
    const toastSubs = new Set();

    function showToast(message) {
      currentToast = { id: ++toastSeq, message, at: Date.now() };
      for (const listener of toastSubs) {
        try {
          listener(currentToast);
        } catch {
          // ignore
        }
      }
    }

    function clearToast() {
      currentToast = null;
      for (const listener of toastSubs) {
        try {
          listener(null);
        } catch {
          // ignore
        }
      }
    }

    function useToast() {
      const [toast, setToast] = useState(currentToast);
      useEffect(() => {
        const listener = (next) => setToast(next);
        toastSubs.add(listener);
        return () => toastSubs.delete(listener);
      }, []);
      return toast;
    }

    function openRightTab() {
      const sidebarRight = runtime === null ? undefined : runtime.get('sidebarRight');
      if (sidebarRight === undefined) {
        showToast('原生右侧栏服务 sidebarRight 不可用（当前 profile 未加载 ui-sidebar-right）');
        return;
      }
      try {
        sidebarRight.openTab(RIGHT_TAB_KIND);
        showToast('已在原生右侧栏打开图鉴demo');
      } catch (error) {
        showToast(`打开右侧栏失败：${errorText(error)}`);
      }
    }

    // ---------------------------------------------------------------------
    // Shared host snapshot (used by the Settings page and the right-sidebar tab)
    // ---------------------------------------------------------------------
    function useHostState() {
      const [state, setState] = useState(null);
      const [error, setError] = useState(null);
      useEffect(() => {
        let stopped = false;
        const load = async () => {
          try {
            const response = await fetch(new URL(`${ROUTE}/state`, document.baseURI), { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const body = await response.json();
            if (!stopped) {
              setState(body);
              setError(null);
            }
          } catch (cause) {
            if (!stopped) setError(errorText(cause));
          }
        };
        load();
        const timer = setInterval(load, 10000);
        return () => {
          stopped = true;
          clearInterval(timer);
        };
      }, []);
      return { state, error };
    }

    // ---------------------------------------------------------------------
    // Presentational pieces
    // ---------------------------------------------------------------------
    function Tag({ children }) {
      return h('span', { className: 'sl-tag' }, children);
    }

    function Btn({ children, onClick, primary = false, disabled = false }) {
      return h(
        'button',
        { type: 'button', className: `sl-btn${primary ? ' sl-btn-primary' : ''}`, onClick, disabled },
        children,
      );
    }

    function CodeBlock({ code }) {
      const [copied, setCopied] = useState(false);
      const copy = async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      };
      return h(
        'div',
        { className: 'sl-code' },
        h('button', { type: 'button', className: 'sl-copy', onClick: copy }, copied ? '已复制' : '复制'),
        h('pre', null, code),
      );
    }

    function SlotPage({ slot, children }) {
      const info = META[slot];
      return h(
        'div',
        { className: 'sl-page' },
        h(
          'div',
          { className: 'sl-page-head' },
          h('div', { className: 'sl-kicker' }, 'PLUGIN API GALLERY'),
          h('h1', { className: 'sl-page-title' }, slotTitle(slot)),
          h('p', { className: 'sl-page-desc' }, info?.desc ?? ''),
          h('div', { className: 'sl-tags' }, Tag(info?.kind ?? 'slot'), Tag(info?.scope ?? '—'), Tag('replaceRisk: none')),
        ),
        children,
        h('div', { className: 'sl-code-title' }, '注册代码'),
        h(CodeBlock, { code: info?.code ?? '' }),
        h('p', { className: 'sl-footnote' }, `slot: ${slot} · kind: ${info?.kind ?? '—'} · scope: ${info?.scope ?? '—'}`),
      );
    }

    function HostSummary({ state, error }) {
      if (error) return h('div', { className: 'sl-error' }, `Host 快照读取失败：${error}`);
      if (state === null) return h('div', { className: 'sl-muted' }, '读取 Host 快照…');
      return h(
        'div',
        { className: 'sl-host' },
        h('div', { className: 'sl-host-title' }, 'Host 实时快照（ctx.webServer.register → /state）'),
        h(
          'dl',
          { className: 'sl-kv' },
          h('dt', null, 'uptime'), h('dd', null, `${Math.round(state.plugin.uptimeMs / 1000)}s`),
          h('dt', null, 'active sessions'), h('dd', null, String(state.sessions.length)),
          h('dt', null, 'visible tools'), h('dd', null, String(state.tools.length)),
          h('dt', null, 'webApp'), h('dd', null, state.server.advertisedUrl ?? '—'),
        ),
        state.sessions.length === 0
          ? h('div', { className: 'sl-muted' }, '当前没有活跃会话。')
          : h(
              'table',
              { className: 'sl-table' },
              h('thead', null, h('tr', null, h('th', null, 'session'), h('th', null, 'cwd'), h('th', null, 'goal'), h('th', null, 'tasks'))),
              h('tbody', null, state.sessions.map((row) => h(
                'tr',
                { key: row.id },
                h('td', null, h('code', { title: row.id, className: 'sl-mono' }, shortId(row.id))),
                h('td', null, row.cwd ?? '—'),
                h('td', null, row.goal && row.goal.phase ? row.goal.phase : '—'),
                h('td', null, Array.isArray(row.schedules) ? String(row.schedules.length) : row.schedules === null || row.schedules === undefined ? '—' : String(row.schedules)),
              ))),
            ),
      );
    }

    // ---------------------------------------------------------------------
    // Detail extras
    // ---------------------------------------------------------------------
    function HeaderExtra() {
      return h(
        'div',
        { className: 'sl-extra' },
        h('p', { className: 'sl-note' }, '这个按钮注册在 conversation.session.header.utilities。按钮本身保持紧凑，完整 slot 名放在 title、aria-label 和本弹层标题里。'),
        h('div', { className: 'sl-actions' },
          h(Btn, { primary: true, onClick: openRightTab }, '打开右侧栏图鉴demo'),
          h(Btn, { onClick: () => showToast('来自 shell.overlay 的通知：按钮点击成功。') }, '触发 shell.overlay 通知'),
        ),
      );
    }

    function FooterExtra() {
      return h(
        'div',
        { className: 'sl-extra' },
        h('p', { className: 'sl-note' }, '侧栏底部动作。宽栏显示文字，窄栏只显示「图」图标；两种形态都保留完整的 aria-label。'),
        h('div', { className: 'sl-actions' },
          h(Btn, { primary: true, onClick: openRightTab }, '打开右侧栏图鉴demo'),
          h(Btn, { onClick: () => showToast('来自 shell.overlay 的通知：footer.action 点击成功。') }, '触发通知'),
        ),
      );
    }

    function SessionExtra({ sessionId, slot }) {
      return h(
        'div',
        { className: 'sl-extra' },
        h('dl', { className: 'sl-kv' },
          h('dt', null, 'slot'), h('dd', null, h('code', { className: 'sl-mono' }, slot)),
          h('dt', null, 'session'), h('dd', null, h('code', { className: 'sl-mono', title: sessionId }, shortId(sessionId))),
        ),
        h('div', { className: 'sl-actions' },
          h(Btn, { primary: true, onClick: openRightTab }, '打开右侧栏图鉴demo'),
          h(Btn, { onClick: () => showToast('这个 Toast 渲染在 shell.overlay 中。') }, '触发通知'),
        ),
      );
    }

    function AssistantExtra({ messageId }) {
      return h(
        'div',
        { className: 'sl-extra' },
        h('dl', { className: 'sl-kv' },
          h('dt', null, 'owner prop'), h('dd', null, h('code', { className: 'sl-mono' }, 'messageId')),
          h('dt', null, 'messageId'), h('dd', null, h('code', { className: 'sl-mono', title: messageId }, shortId(messageId))),
        ),
      );
    }

    function TurnExtra({ turn, seq }) {
      let turnText = '—';
      try {
        turnText = JSON.stringify(turn);
      } catch {
        turnText = String(turn);
      }
      return h(
        'div',
        { className: 'sl-extra' },
        h('dl', { className: 'sl-kv' },
          h('dt', null, 'turn'), h('dd', null, h('code', { className: 'sl-mono' }, turnText)),
          h('dt', null, 'seq'), h('dd', null, String(seq)),
        ),
      );
    }

    function HeroExtra() {
      return h(
        'div',
        { className: 'sl-extra' },
        h('p', { className: 'sl-note' }, 'Hero 行只在新建会话的空状态出现。它和 workspace / preset 控件同一行，空间有限，所以只显示短标签；完整 slot 名在 tooltip 和弹层里。'),
        h('div', { className: 'sl-actions' }, h(Btn, { primary: true, onClick: openRightTab }, '打开右侧栏图鉴demo')),
      );
    }

    function GalleryMenuIcon({ size = 14 }) {
      return h(
        'span',
        {
          className: 'sl-menu-glyph',
          style: { width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.62)) },
          'aria-hidden': true,
        },
        '图',
      );
    }

    function CommandUiExtra() {
      return h(
        'div',
        { className: 'sl-extra' },
        h('p', { className: 'sl-note' }, '这一行由客户端服务 ctx.commandUi.register 注册，不是 Slot。它同时出现在 composer 的 + 菜单和 / 菜单里；点它会打开这个详情弹层。'),
        h('div', { className: 'sl-actions' },
          h(Btn, { primary: true, onClick: openRightTab }, '打开右侧栏图鉴demo'),
          h(Btn, { onClick: () => showToast('来自 commandUi action 的 shell.overlay 通知') }, '触发通知'),
        ),
        h('p', { className: 'sl-note' }, '「添加」分组的内置行（File / Goal / Plan / Feedback）是 ui-commands 里的固定名单；自定义 contribution 会落到「指令」分组，无法直接插进「添加」而不改内置包。'),
      );
    }

    // ---------------------------------------------------------------------
    // Small distributed entries
    // ---------------------------------------------------------------------
    function HeaderUtilitiesDemo() {
      return h(
        'button',
        {
          type: 'button',
          className: 'sl-header-btn',
          title: slotTitle(SLOT.header),
          'aria-label': slotTitle(SLOT.header),
          onClick: () => openSlotDetail(SLOT.header, h(HeaderExtra)),
        },
        h('span', { className: 'sl-header-dot' }),
        h('span', null, '图鉴demo'),
      );
    }

    function ComposerDockDemo({ sessionId }) {
      return h(
        'button',
        {
          type: 'button',
          className: 'sl-dock',
          title: slotTitle(SLOT.dock),
          'aria-label': slotTitle(SLOT.dock),
          onClick: () => openSlotDetail(SLOT.dock, h(SessionExtra, { sessionId, slot: SLOT.dock })),
        },
        h('span', { className: 'sl-dock-mark' }, '图'),
        h('span', null, '图鉴demo'),
        h('span', { className: 'sl-dock-slot' }, 'conversation.composer.dock'),
      );
    }

    function InputButton({ slot, label, sessionId }) {
      return h(
        'button',
        {
          type: 'button',
          className: 'sl-mini-btn',
          title: slotTitle(slot),
          'aria-label': slotTitle(slot),
          onClick: () => openSlotDetail(slot, h(SessionExtra, { sessionId, slot })),
        },
        label,
      );
    }

    function InputLeftDemo({ sessionId }) {
      return h(InputButton, { slot: SLOT.inputLeft, label: '图', sessionId });
    }

    function InputRightDemo({ sessionId }) {
      return h(InputButton, { slot: SLOT.inputRight, label: '图', sessionId });
    }

    function AssistantActionDemo({ messageId }) {
      return h(
        'button',
        {
          type: 'button',
          className: 'sl-link',
          title: slotTitle(SLOT.assistant),
          'aria-label': slotTitle(SLOT.assistant),
          onClick: () => openSlotDetail(SLOT.assistant, h(AssistantExtra, { messageId })),
        },
        '图鉴demo',
      );
    }

    function TurnTailDemo({ turn, seq }) {
      return h(
        'button',
        {
          type: 'button',
          className: 'sl-turn-tail',
          title: slotTitle(SLOT.turnTail),
          'aria-label': slotTitle(SLOT.turnTail),
          onClick: () => openSlotDetail(SLOT.turnTail, h(TurnExtra, { turn, seq })),
        },
        h('span', null, '图鉴demo'),
        h('span', { className: 'sl-turn-slot' }, 'conversation.chat.turnTail'),
      );
    }

    function SessionRowLeadingDemo({ sessionId }) {
      const open = (event) => {
        event.preventDefault();
        event.stopPropagation();
        openSlotDetail(SLOT.sessionRow, h(SessionExtra, { sessionId, slot: SLOT.sessionRow }));
      };
      return h(
        'span',
        {
          className: 'sl-row-badge',
          role: 'button',
          tabIndex: 0,
          title: slotTitle(SLOT.sessionRow),
          'aria-label': slotTitle(SLOT.sessionRow),
          onClick: open,
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') open(event);
          },
        },
        '图',
      );
    }

    function FooterActionDemo({ wide }) {
      return h(
        'button',
        {
          type: 'button',
          className: wide ? 'sl-footer-btn' : 'sl-footer-rail',
          title: slotTitle(SLOT.footer),
          'aria-label': slotTitle(SLOT.footer),
          onClick: () => openSlotDetail(SLOT.footer, h(FooterExtra)),
        },
        h('span', { className: 'sl-footer-icon' }, '图'),
        wide ? h('span', null, '图鉴demo') : null,
      );
    }

    function HeroOptionDemo() {
      return h(
        'button',
        {
          type: 'button',
          className: 'sl-hero-btn',
          title: slotTitle(SLOT.hero),
          'aria-label': slotTitle(SLOT.hero),
          onClick: () => openSlotDetail(SLOT.hero, h(HeroExtra)),
        },
        '图鉴demo',
      );
    }

    function SettingsGeneralRowDemo() {
      const [enabled, setEnabled] = useState(false);
      return h(
        'div',
        { className: 'sl-general-row' },
        h(
          'div',
          { className: 'sl-general-text' },
          h('div', { className: 'sl-general-title' }, '图鉴demo'),
          h('div', { className: 'sl-general-sub' }, SLOT.general),
        ),
        h(
          'div',
          { className: 'sl-general-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'sl-switch',
              role: 'switch',
              'aria-checked': enabled,
              'aria-label': slotTitle(SLOT.general),
              onClick: () => setEnabled((value) => !value),
            },
            h('span'),
          ),
          h('button', { type: 'button', className: 'sl-link', onClick: () => openSlotDetail(SLOT.general) }, '详情'),
        ),
      );
    }

    // ---------------------------------------------------------------------
    // A-新增 18 + 安全 C 子集：通用 GalleryEntry / shared extras / bespoke
    // ---------------------------------------------------------------------

    // Shown inside the shared shell.overlay modal for every generic entry.
    // It only reads the static GENERIC_SLOTS entry, never owner props.
    function GenericSlotExtra({ entry }) {
      const info = META[entry.slot];
      return h(
        'div',
        { className: 'sl-extra' },
        h('dl', { className: 'sl-kv' },
          h('dt', null, 'slot'), h('dd', null, h('code', { className: 'sl-mono' }, entry.slot)),
          h('dt', null, '注册 id'), h('dd', null, h('code', { className: 'sl-mono' }, info ? info.id : '—')),
          h('dt', null, 'mode'), h('dd', null, h('code', { className: 'sl-mono' }, entry.mode ?? '—')),
          h('dt', null, 'order'), h('dd', null, String(entry.order ?? '—')),
        ),
        h('p', { className: 'sl-note' }, '通用 GalleryEntry 入口：owner props 一律按 undefined 防御（只读判空、不调用 openFile 等副作用）；点击只打开这个 shell.overlay 详情弹层，没有 per-entry 的 bespoke 弹层。'),
      );
    }

    // One component for every mode in GENERIC_SLOTS. It reads exactly one prop
    // (`entry`, injected by the registration wrapper) and ignores all owner
    // props, so unknown contexts cannot throw or trigger side effects.
    function GalleryEntry(props) {
      const entry = props && props.entry ? props.entry : { slot: 'unknown', mode: 'row', order: 50 };
      const slot = entry.slot;
      const mode = entry.mode || 'row';
      const open = () => openSlotDetail(slot, h(GenericSlotExtra, { entry }));
      const base = {
        type: 'button',
        className: `sl-gen sl-gen-${mode}`,
        title: slotTitle(slot),
        'aria-label': slotTitle(slot),
        onClick: open,
      };
      const glyph = h('span', { className: 'sl-gen-glyph', 'aria-hidden': true }, '图');
      const label = h('span', { className: 'sl-gen-label' }, '图鉴demo');
      const short = h('span', { className: 'sl-gen-slot' }, shortSlot(slot));
      if (mode === 'icon-button') return h('button', base, glyph);
      if (mode === 'link') return h('button', base, '图鉴demo');
      if (mode === 'badge') return h('button', base, glyph, h('span', null, '图鉴demo'));
      if (mode === 'chip') return h('button', base, glyph, label);
      if (mode === 'menu-item') return h('button', { ...base, role: 'menuitem' }, glyph, label, short);
      if (mode === 'inline') {
        // onboarding 步骤常被 owner 包在自己的按钮/卡片里；用 span 避免嵌套 button。
        return h(
          'span',
          {
            className: base.className,
            title: base.title,
            'aria-label': base['aria-label'],
            role: 'button',
            tabIndex: 0,
            onClick: open,
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') open();
            },
          },
          glyph,
          label,
          short,
        );
      }
      // button / row share the same row layout
      return h('button', base, glyph, label, short);
    }

    // Bespoke A6: a full tab page in Settings → Plugins.
    function PluginsTabDemo() {
      const { state, error } = useHostState();
      return h(
        SlotPage,
        { slot: 'plugins.tab' },
        h('p', { className: 'sl-note' }, '这个 tab 出现在 Settings → Plugins 的 tab 列表里，排在 Installed / Discover 之后。它是页内 tab，不是主面板，也不替换任何内置页面。'),
        h('div', { className: 'sl-actions' },
          h(Btn, { primary: true, onClick: openRightTab }, '打开右侧栏图鉴demo'),
          h(Btn, { onClick: () => openSlotDetail('plugins.tab') }, '打开详情弹层'),
        ),
        h(HostSummary, { state, error }),
      );
    }

    // Bespoke A10: an inline section on the plugin detail page.
    function PluginsDetailSectionDemo() {
      const info = META['plugins.detail.section'];
      return h(
        'section',
        { className: 'sl-gen-section' },
        h('h3', { className: 'sl-gen-section-title' }, slotTitle('plugins.detail.section')),
        h('p', { className: 'sl-note' }, info.desc),
        h(CodeBlock, { code: info.code }),
        h('div', { className: 'sl-actions' }, h(Btn, { primary: true, onClick: () => openSlotDetail('plugins.detail.section') }, '打开详情弹层')),
      );
    }

    // Bespoke A15 (keyed): the chip title of the gallery's own right-sidebar
    // tab. The injected useTabInfo hook is called only when present and is
    // wrapped because the owner project is not statically verified.
    function PaneTabTitleDemo(props) {
      let tab = null;
      try {
        if (props && typeof props.useTabInfo === 'function') {
          const info = props.useTabInfo();
          tab = info && info.tab ? info.tab : null;
        }
      } catch {
        tab = null;
      }
      const tabId = tab && tab.id ? tab.id : RIGHT_TAB_ID;
      return h(
        'span',
        {
          className: 'sl-pane-title',
          'data-tab': tabId,
          title: slotTitle('sidebar.right.pane.tab.title'),
          'aria-label': slotTitle('sidebar.right.pane.tab.title'),
        },
        h('span', { className: 'sl-pane-chip' }, '图'),
        h('span', { className: 'sl-pane-text' }, '图鉴demo'),
      );
    }

    // Bespoke C8 (keyed): a guide card for the gallery's own right-sidebar
    // tab provider. Rendered inside whatever wrapper the owner uses, so it is
    // a span with role=button rather than a nested <button>.
    function GuideEntryDemo() {
      const open = () => openSlotDetail('sidebar.right.tab.guide.entry', h(GenericSlotExtra, { entry: { slot: 'sidebar.right.tab.guide.entry', mode: 'guide-card', order: 0 } }));
      return h(
        'span',
        {
          className: 'sl-guide-card',
          role: 'button',
          tabIndex: 0,
          title: slotTitle('sidebar.right.tab.guide.entry'),
          'aria-label': slotTitle('sidebar.right.tab.guide.entry'),
          onClick: open,
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') open();
          },
        },
        h('span', { className: 'sl-guide-title' }, '图鉴demo'),
        h('span', { className: 'sl-guide-desc' }, 'guide 卡 · key api-gallery:right-tab'),
      );
    }

    // The main/panellist pair: the icon is the only entry into this page.
    function PanelIcon({ size = 20, active = false }) {
      const dots = [];
      for (const x of [6, 12, 18]) {
        for (const y of [6, 12, 18]) {
          dots.push(
            h('rect', {
              key: `${x}-${y}`,
              x: x - 1.7,
              y: y - 1.7,
              width: 3.4,
              height: 3.4,
              rx: 0.8,
              fill: 'currentColor',
              opacity: x === 12 && y === 12 ? 1 : 0.5,
            }),
          );
        }
      }
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, style: { display: 'block', opacity: active ? 1 : 0.72 } },
        h('rect', { x: 2.5, y: 2.5, width: 19, height: 19, rx: 5, fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, opacity: 0.45 }),
        dots,
      );
    }

    function useNonUiReference() {
      const [data, setData] = useState(null);
      const [error, setError] = useState(null);
      useEffect(() => {
        let stopped = false;
        fetch(new URL(`${ROUTE}/non-ui`, document.baseURI), { cache: 'no-store' })
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
          })
          .then((body) => {
            if (!stopped) {
              setData(body);
              setError(null);
            }
          })
          .catch((cause) => {
            if (!stopped) setError(errorText(cause));
          });
        return () => {
          stopped = true;
        };
      }, []);
      return { data, error };
    }

    function useInterfacesReference() {
      const [data, setData] = useState(null);
      const [error, setError] = useState(null);
      useEffect(() => {
        let stopped = false;
        fetch(new URL(`${ROUTE}/interfaces`, document.baseURI), { cache: 'no-store' })
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
          })
          .then((body) => {
            if (!stopped) {
              setData(body);
              setError(null);
            }
          })
          .catch((cause) => {
            if (!stopped) setError(errorText(cause));
          });
        return () => {
          stopped = true;
        };
      }, []);
      return { data, error };
    }

    function NonUiRow({ item, regionInfo }) {
      return h(
        'details',
        { className: 'sl-nonui-row' },
        h(
          'summary',
          null,
          h('code', { className: 'sl-nonui-name' }, item.name),
          h('span', { className: 'sl-nonui-region' }, item.regionLabel ?? item.region ?? '—'),
          h('span', { className: 'sl-tag' }, `${item.kind}/${item.scope}`),
          h('span', { className: 'sl-nonui-reason', title: item.reason }, item.reason),
        ),
        h(
          'div',
          { className: 'sl-nonui-body' },
          h('p', { className: 'sl-nonui-where' }, regionInfo ? `${regionInfo.title}：${regionInfo.where}` : ''),
          h('p', { className: 'sl-note' }, item.purpose || '（无 purpose）'),
          h('p', { className: 'sl-nonui-breadcrumb' }, item.breadcrumb ?? '—'),
          h(
            'dl',
            { className: 'sl-kv' },
            h('dt', null, 'type'), h('dd', null, item.type),
            h('dt', null, 'kind'), h('dd', null, item.kind),
            h('dt', null, 'scope'), h('dd', null, item.scope),
            h('dt', null, 'parent'), h('dd', null, item.parent ?? '—'),
            h('dt', null, 'replaceRisk'), h('dd', null, item.replaceRisk ?? '—'),
            item.keyDomain ? h('dt', null, 'keyDomain') : null,
            item.keyDomain ? h('dd', null, h('code', { className: 'sl-mono' }, item.keyDomain)) : null,
            item.registration && item.registration.length > 0 ? h('dt', null, 'registration') : null,
            item.registration && item.registration.length > 0
              ? h('dd', null, item.registration.map((option) => `${option.name}${option.required ? '*' : ''}`).join(', '))
              : null,
          ),
          h('p', { className: 'sl-nonui-reason-full' }, item.reason),
        ),
      );
    }

    const UI_MAP_COLUMNS = [
      { title: '左栏', ids: ['sidebar', 'sessions', 'settings'] },
      { title: '中央', ids: ['main', 'header', 'chat', 'composer', 'hero', 'plugins'] },
      { title: '右侧', ids: ['rightbar'] },
    ];

    function UiMap({ regions, active, onSelect }) {
      const byId = Object.fromEntries(regions.map((region) => [region.id, region]));
      const button = (id) => {
        const region = byId[id];
        if (region === undefined) return null;
        return h(
          'button',
          {
            key: id,
            type: 'button',
            className: `sl-map-region${active === id ? ' is-active' : ''}`,
            title: region.where,
            onClick: () => onSelect(active === id ? 'all' : id),
          },
          h('span', { className: 'sl-map-title' }, region.title),
          h('span', { className: 'sl-map-count' }, region.count),
        );
      };
      return h(
        'div',
        { className: 'sl-map' },
        h('div', { className: 'sl-map-caption' }, 'UI 位置示意图（点击区域过滤，再点一次取消；不是精确布局）'),
        h('div', { className: 'sl-map-row' }, button('frame')),
        h('div', { className: 'sl-map-columns' },
          UI_MAP_COLUMNS.map((column) => h(
            'div',
            { key: column.title, className: 'sl-map-col' },
            h('div', { className: 'sl-map-col-title' }, column.title),
            column.ids.map((id) => button(id)),
          )),
        ),
        h('div', { className: 'sl-map-row' }, button('overlay')),
        active !== 'all' && byId[active] ? h('div', { className: 'sl-map-where' }, `${byId[active].title}：${byId[active].where}`) : null,
      );
    }

    function NonUiReference() {
      const { data, error } = useNonUiReference();
      const [query, setQuery] = useState('');
      const [regionFilter, setRegionFilter] = useState('all');
      if (error) return h('div', { className: 'sl-error' }, `读取 /plugin-api-gallery/non-ui 失败：${error}`);
      if (data === null) return h('div', { className: 'sl-muted' }, '读取不可见 Slot 清单…');
      const q = query.trim().toLowerCase();
      const regions = Array.isArray(data.regions) ? data.regions : [];
      const regionById = Object.fromEntries(regions.map((region) => [region.id, region]));
      const groups = data.groups
        .map((group) => ({
          ...group,
          totalCount: group.items.length,
          items: group.items.filter((item) => (regionFilter === 'all' || item.region === regionFilter)
            && (q === '' || `${item.name} ${item.purpose} ${item.reason}`.toLowerCase().includes(q))),
        }))
        .filter((group) => group.items.length > 0);
      const shown = groups.reduce((total, group) => total + group.items.length, 0);
      return h(
        'div',
        { className: 'sl-nonui' },
        h(
          'div',
          { className: 'sl-nonui-summary' },
          h('div', { className: 'sl-nonui-summary-title' }, '57 个不可见 Slot + 6 个 Factory'),
          h('div', { className: 'sl-nonui-summary-sub' }, `数据来自 /plugin-api-gallery/non-ui（DSH ${data.dshVersion}，${data.generatedAt}）。这些不是 demo 注册，只是“为什么不做 UI”的逐项参考。`),
          h('div', { className: 'sl-nonui-badges' }, data.groups.map((group) => h('span', { key: group.id, className: 'sl-tag' }, group.title))),
        ),
        h(UiMap, { regions, active: regionFilter, onSelect: setRegionFilter }),
        h(
          'div',
          { className: 'sl-search' },
          h('input', {
            className: 'sl-input',
            placeholder: '过滤 slot 名 / 用途 / 原因…',
            value: query,
            onChange: (event) => setQuery(event.target.value),
          }),
          h('span', { className: 'sl-tag' }, `${shown} / ${data.total}`),
        ),
        groups.map((group) => h(
          'section',
          { key: group.id, className: 'sl-nonui-group' },
          h(
            'div',
            { className: 'sl-nonui-group-head' },
            h('h2', null, group.title),
            h('p', null, group.reason),
          ),
          h('div', { className: 'sl-nonui-list' }, group.items.map((item) => h(NonUiRow, {
            key: item.name,
            item,
            regionInfo: regionById[item.region],
          }))),
        )),
      );
    }

    function EventRow({ event, scope }) {
      return h(
        'details',
        { className: 'sl-ref-row' },
        h(
          'summary',
          null,
          h('code', { className: 'sl-ref-name' }, event.name),
          h('span', { className: 'sl-ref-mode' }, event.mode),
          h('span', { className: 'sl-ref-desc' }, event.description),
        ),
        h(
          'div',
          { className: 'sl-ref-body' },
          h('p', { className: 'sl-ref-desc-full' }, event.description),
          h(
            'dl',
            { className: 'sl-kv' },
            h('dt', null, 'scope'), h('dd', null, scope),
            h('dt', null, 'mode'), h('dd', null, event.mode),
            h('dt', null, 'signature'), h('dd', null, h('code', { className: 'sl-mono' }, event.signature)),
          ),
          h('div', { className: 'sl-ref-code' }, h(CodeBlock, { code: event.observe })),
        ),
      );
    }

    function EventsReference({ data, error }) {
      const [query, setQuery] = useState('');
      if (error) return h('div', { className: 'sl-error' }, `读取 /plugin-api-gallery/interfaces 失败：${error}`);
      if (data === null) return h('div', { className: 'sl-muted' }, '读取 Events…');
      const q = query.trim().toLowerCase();
      const match = (event, scope) => q === ''
        || `${event.name} ${event.mode} ${event.description} ${event.signature} ${scope}`.toLowerCase().includes(q);
      const host = data.events.host.filter((event) => match(event, 'host'));
      const client = data.events.client.filter((event) => match(event, 'client'));
      const shown = host.length + client.length;
      return h(
        'div',
        { className: 'sl-nonui' },
        h(
          'div',
          { className: 'sl-nonui-summary' },
          h('div', { className: 'sl-nonui-summary-title' }, `${data.counts.hostEvents} Host Events + ${data.counts.clientEvents} Client Events`),
          h('div', { className: 'sl-nonui-summary-sub' }, '事件没有视觉座位：用 ctx.on 观察或改写；waterfall 必须 return next()，emit/serial/parallel 按各自语义。它们是“非 UI 接口”，但可以驱动 UI/日志/状态。'),
          h('div', { className: 'sl-nonui-badges' },
            h('span', { className: 'sl-tag' }, 'waterfall'),
            h('span', { className: 'sl-tag' }, 'emit'),
            h('span', { className: 'sl-tag' }, 'serial / parallel'),
          ),
        ),
        h(
          'div',
          { className: 'sl-search' },
          h('input', {
            className: 'sl-input',
            placeholder: '过滤事件名 / mode / 签名 / 描述…',
            value: query,
            onChange: (event) => setQuery(event.target.value),
          }),
          h('span', { className: 'sl-tag' }, `${shown} / ${data.events.host.length + data.events.client.length}`),
        ),
        host.length === 0 ? null : h(
          'section',
          { className: 'sl-nonui-group' },
          h('div', { className: 'sl-nonui-group-head' }, h('h2', null, `Host Events（${host.length}）`), h('p', null, 'Host 侧事件；观察者通过 ctx.on 订阅。')),
          h('div', { className: 'sl-nonui-list' }, host.map((event) => h(EventRow, { key: event.name, event, scope: 'host' }))),
        ),
        client.length === 0 ? null : h(
          'section',
          { className: 'sl-nonui-group' },
          h('div', { className: 'sl-nonui-group-head' }, h('h2', null, `Client Events（${client.length}）`), h('p', null, '浏览器侧事件；插件在 Client half 用 ctx.on 订阅。')),
          h('div', { className: 'sl-nonui-list' }, client.map((event) => h(EventRow, { key: event.name, event, scope: 'client' }))),
        ),
      );
    }

    function ServiceRow({ service, scope }) {
      return h(
        'details',
        { className: 'sl-ref-row' },
        h(
          'summary',
          null,
          h('code', { className: 'sl-ref-name' }, service.key),
          service.used ? h('span', { className: 'sl-ref-used' }, '图鉴已用') : null,
          h('span', { className: 'sl-ref-desc' }, service.description),
        ),
        h(
          'div',
          { className: 'sl-ref-body' },
          h('p', { className: 'sl-ref-desc-full' }, service.description),
          h(
            'dl',
            { className: 'sl-kv' },
            h('dt', null, 'scope'), h('dd', null, scope),
            h('dt', null, 'methods'), h('dd', null, String(service.methods.length)),
          ),
          h('div', { className: 'sl-ref-code' }, h(CodeBlock, { code: service.use })),
          h('div', { className: 'sl-ref-code' }, h(CodeBlock, { code: service.methods.join('\n') })),
        ),
      );
    }

    function ServicesReference({ data, error }) {
      const [query, setQuery] = useState('');
      if (error) return h('div', { className: 'sl-error' }, `读取 /plugin-api-gallery/interfaces 失败：${error}`);
      if (data === null) return h('div', { className: 'sl-muted' }, '读取 Services…');
      const q = query.trim().toLowerCase();
      const match = (service, scope) => q === ''
        || `${service.key} ${service.description} ${service.methods.join(' ')} ${scope}`.toLowerCase().includes(q);
      const host = data.services.host.filter((service) => match(service, 'host'));
      const client = data.services.client.filter((service) => match(service, 'client'));
      const extra = data.services.extraClient.filter((service) => match(service, 'client'));
      const shown = host.length + client.length + extra.length;
      return h(
        'div',
        { className: 'sl-nonui' },
        h(
          'div',
          { className: 'sl-nonui-summary' },
          h('div', { className: 'sl-nonui-summary-title' }, `${data.counts.hostServices} Host Services + ${data.counts.clientServices} Client Services + ${data.counts.extraClientServices} source-verified extras`),
          h('div', { className: 'sl-nonui-summary-sub' }, 'Service 没有视觉座位；用 ctx.get("key") 读取。UI 是另一层：同一个服务可以驱动 UI，但服务本身不是 Slot。标“图鉴已用”的是本插件实际消费的。'),
          h('div', { className: 'sl-nonui-badges' },
            h('span', { className: 'sl-tag' }, 'Host 98'),
            h('span', { className: 'sl-tag' }, 'Client 8'),
            h('span', { className: 'sl-tag' }, 'extra 4'),
          ),
        ),
        h(
          'div',
          { className: 'sl-search' },
          h('input', {
            className: 'sl-input',
            placeholder: '过滤 service key / 方法 / 描述…',
            value: query,
            onChange: (event) => setQuery(event.target.value),
          }),
          h('span', { className: 'sl-tag' }, `${shown} / ${data.counts.hostServices + data.counts.clientServices + data.counts.extraClientServices}`),
        ),
        host.length === 0 ? null : h(
          'section',
          { className: 'sl-nonui-group' },
          h('div', { className: 'sl-nonui-group-head' }, h('h2', null, `Host Services（${host.length}）`), h('p', null, 'Host 侧 Service，通过 ctx.get 读取；强依赖才放进 inject。')),
          h('div', { className: 'sl-nonui-list' }, host.map((service) => h(ServiceRow, { key: service.key, service, scope: 'host' }))),
        ),
        client.length === 0 ? null : h(
          'section',
          { className: 'sl-nonui-group' },
          h('div', { className: 'sl-nonui-group-head' }, h('h2', null, `Client Services（${client.length}）`), h('p', null, 'Client 侧 Service，通过受限 ctx.get 读取。')),
          h('div', { className: 'sl-nonui-list' }, client.map((service) => h(ServiceRow, { key: service.key, service, scope: 'client' }))),
        ),
        extra.length === 0 ? null : h(
          'section',
          { className: 'sl-nonui-group' },
          h('div', { className: 'sl-nonui-group-head' }, h('h2', null, `Source-verified Client Services（${extra.length}）`), h('p', null, 'Inspect 的 Client Service 目录没有列出、但包内确实提供的服务（本插件直接消费了其中 3 个）。')),
          h('div', { className: 'sl-nonui-list' }, extra.map((service) => h(ServiceRow, { key: service.key, service, scope: 'client' }))),
        ),
      );
    }

    function ToolsReference({ data, error, tools }) {
      if (error) return h('div', { className: 'sl-error' }, `读取 /plugin-api-gallery/interfaces 失败：${error}`);
      if (data === null) return h('div', { className: 'sl-muted' }, '读取 Tools / Builtins…');
      return h(
        'div',
        { className: 'sl-nonui' },
        h(
          'div',
          { className: 'sl-nonui-summary' },
          h('div', { className: 'sl-nonui-summary-title' }, `当前模型可见 Tools（${tools.length}）+ ${data.counts.clientBuiltins} Client Builtins`),
          h('div', { className: 'sl-nonui-summary-sub' }, 'Tool 是 model-facing 能力，不是 UI 席位；唯一 UI 是 Chat 里的工具结果卡片。Client Builtins 是浏览器半可直接使用的符号，也不是 Slot。'),
        ),
        h(
          'section',
          { className: 'sl-nonui-group' },
          h('div', { className: 'sl-nonui-group-head' }, h('h2', null, '当前模型可见 Tools'), h('p', null, '来自 /plugin-api-gallery/state 的实时 tools 快照。')),
          tools.length === 0
            ? h('div', { className: 'sl-muted' }, '当前快照没有读到 tools。')
            : h('div', { className: 'sl-nonui-list' }, tools.map((tool) => h(
                'details',
                { key: tool.name, className: 'sl-ref-row' },
                h('summary', null, h('code', { className: 'sl-ref-name' }, tool.name), h('span', { className: 'sl-ref-desc' }, tool.description)),
                h('div', { className: 'sl-ref-body' }, h('p', { className: 'sl-ref-desc-full' }, tool.description)),
              ))),
        ),
        h(
          'section',
          { className: 'sl-nonui-group' },
          h('div', { className: 'sl-nonui-group-head' }, h('h2', null, 'Client Builtins'), h('p', null, '动态 Client half 可直接使用的符号；持久化 bundle 只有 React + 浏览器全局。')),
          h('div', { className: 'sl-nonui-list' }, data.builtins.map((builtin) => h(
            'details',
            { key: builtin.name, className: 'sl-ref-row' },
            h('summary', null, h('code', { className: 'sl-ref-name' }, builtin.name), h('span', { className: 'sl-ref-desc' }, builtin.description)),
            h('div', { className: 'sl-ref-body' },
              h('p', { className: 'sl-ref-desc-full' }, builtin.description),
              h('div', { className: 'sl-ref-code' }, h(CodeBlock, { code: builtin.signatures.join('\n') })),
            ),
          ))),
        ),
        h(
          'details',
          { className: 'sl-code-toggle' },
          h('summary', null, `Theme tokens（${data.counts.themeTokens} 个 UI 令牌，不是事件/接口）`),
          h('div', { className: 'sl-nonui-list' }, data.themeTokens.map((token) => h(
            'div',
            { key: token.name, className: 'sl-ref-row' },
            h('div', { className: 'sl-ref-token' }, h('code', { className: 'sl-ref-name' }, token.name), h('span', { className: 'sl-ref-desc' }, token.description)),
          ))),
        ),
      );
    }

    function MainPanelDemo() {
      const { state, error } = useHostState();
      const { data: interfaces, error: interfacesError } = useInterfacesReference();
      const [tab, setTab] = useState('slots');
      const counts = interfaces ? interfaces.counts : null;
      const tabs = [
        { id: 'slots', label: 'Slot / Factory (63)' },
        { id: 'events', label: `Events (${counts ? counts.hostEvents + counts.clientEvents : 80})` },
        { id: 'services', label: `Services (${counts ? counts.hostServices + counts.clientServices + counts.extraClientServices : 110})` },
        { id: 'tools', label: 'Tools / Builtins' },
      ];
      return h(
        'div',
        { className: 'sl-page' },
        h(
          'div',
          { className: 'sl-page-head' },
          h('div', { className: 'sl-kicker' }, '图鉴demo · main + sidebar.panellist'),
          h('h1', { className: 'sl-page-title' }, '非 UI 接口参考'),
          h('p', { className: 'sl-page-desc' }, '本页由 sidebar.panellist 的图鉴demo 图标打开；收录 57 个不可见 Slot + 6 个 Factory、Host/Client Events、Host/Client Services、Tools/Builtins。43 个可交互 Slot 仍在各自位置。'),
        ),
        h('div', { className: 'sl-actions' },
          h(Btn, { primary: true, onClick: openRightTab }, '打开右侧栏图鉴demo'),
          h(Btn, { onClick: () => showToast('main 页面里的 shell.overlay 通知') }, '触发通知'),
        ),
        h('nav', { className: 'sl-tabs', role: 'tablist' },
          tabs.map((entry) => h(
            'button',
            {
              key: entry.id,
              type: 'button',
              className: 'sl-tab',
              role: 'tab',
              'aria-selected': tab === entry.id,
              onClick: () => setTab(entry.id),
            },
            entry.label,
          )),
        ),
        tab === 'slots' ? h(NonUiReference) : null,
        tab === 'events' ? h(EventsReference, { data: interfaces, error: interfacesError }) : null,
        tab === 'services' ? h(ServicesReference, { data: interfaces, error: interfacesError }) : null,
        tab === 'tools' ? h(ToolsReference, { data: interfaces, error: interfacesError, tools: state ? state.tools : [] }) : null,
        h(
          'details',
          { className: 'sl-code-toggle' },
          h('summary', null, '本页的 main / sidebar.panellist 注册代码'),
          h(CodeBlock, { code: `${META[SLOT.main].code}\n\n${META[SLOT.panelList].code}` }),
        ),
        h(
          'details',
          { className: 'sl-code-toggle' },
          h('summary', null, 'Host 实时快照'),
          h(HostSummary, { state, error }),
        ),
      );
    }

    function ToolViewDemo() {
      return h(
        'div',
        { className: 'sl-chatview' },
        h('div', { className: 'sl-chatview-title' }, '图鉴demo · tool.call.toolview'),
        h('div', { className: 'sl-chatview-sub' }, '工具：api_gallery_demo'),
        h('div', { className: 'sl-chatview-actions' }, h(Btn, { onClick: () => openSlotDetail(SLOT.toolView) }, '详情')),
      );
    }

    function CommandViewDemo() {
      return h(
        'div',
        { className: 'sl-chatview' },
        h('div', { className: 'sl-chatview-title' }, '图鉴demo · conversation.chat.commandview'),
        h('div', { className: 'sl-chatview-sub' }, '命令：/api-gallery'),
        h('div', { className: 'sl-chatview-actions' }, h(Btn, { onClick: () => openSlotDetail(SLOT.commandView) }, '详情')),
      );
    }

    // ---------------------------------------------------------------------
    // Full-page surfaces
    // ---------------------------------------------------------------------
    function ConversationViewDemo({ sessionId, openView }) {
      const [count, setCount] = useState(0);
      return h(
        SlotPage,
        { slot: SLOT.view },
        h('dl', { className: 'sl-kv' },
          h('dt', null, 'session'), h('dd', null, h('code', { className: 'sl-mono', title: sessionId }, shortId(sessionId))),
          h('dt', null, 'view id'), h('dd', null, h('code', { className: 'sl-mono' }, OPEN_IDS.view)),
        ),
        h('div', { className: 'sl-actions' },
          h(Btn, { primary: true, onClick: openRightTab }, '打开右侧栏图鉴demo'),
          h(Btn, { onClick: () => setCount((value) => value + 1) }, `本 tab 内计数：${count}`),
          h(Btn, {
            onClick: () => {
              try {
                if (typeof openView === 'function') openView('chat', '');
              } catch (error) {
                showToast(errorText(error));
              }
            },
          }, '切回 Chat'),
        ),
        h('p', { className: 'sl-note' }, '这是一个真实的 conversation.view tab：切到别的会话再回来，它会重新挂载并拿到新的 sessionId。'),
      );
    }

    function SettingsSectionDemo({ close }) {
      const { state, error } = useHostState();
      return h(
        SlotPage,
        { slot: SLOT.settings },
        h('div', { className: 'sl-actions' },
          h(Btn, { primary: true, onClick: close }, '关闭设置'),
          h(Btn, { onClick: openRightTab }, '打开右侧栏图鉴demo'),
        ),
        h(HostSummary, { state, error }),
      );
    }

    function SettingsPluginsTabDemo() {
      return h(
        SlotPage,
        { slot: SLOT.pluginsTab },
        h('p', { className: 'sl-note' }, '这个 tab 出现在 Settings → Plugins 的 tab 列表里，与 Installed / Discover 并列。它不是主面板，也不替换任何内置页面。'),
        h('div', { className: 'sl-actions' }, h(Btn, { primary: true, onClick: openRightTab }, '打开右侧栏图鉴demo')),
      );
    }

    function RightSidebarTabDemo(props) {
      const info = typeof props.useTabInfo === 'function' ? props.useTabInfo() : null;
      const tab = info && info.tab ? info.tab : null;
      const panel = info && info.panel ? info.panel : null;
      const { state, error } = useHostState();
      const close = () => {
        try {
          runtime.get('sidebarRight').close(tab.id);
        } catch (cause) {
          showToast(`关闭失败：${errorText(cause)}`);
        }
      };
      return h(
        SlotPage,
        { slot: SLOT.rightTab },
        h('dl', { className: 'sl-kv' },
          h('dt', null, 'session'), h('dd', null, h('code', { className: 'sl-mono', title: props.sessionId }, shortId(props.sessionId))),
          h('dt', null, 'tab.id'), h('dd', null, h('code', { className: 'sl-mono' }, tab ? tab.id : '—')),
          h('dt', null, 'tab.kind'), h('dd', null, h('code', { className: 'sl-mono' }, tab ? tab.kind : '—')),
          h('dt', null, 'visible'), h('dd', null, tab ? String(tab.visible) : '—'),
          h('dt', null, 'panel.id'), h('dd', null, h('code', { className: 'sl-mono' }, panel ? panel.id : '—')),
        ),
        h('div', { className: 'sl-actions' },
          h(Btn, { primary: true, onClick: openRightTab }, '再开一个'),
          h(Btn, { onClick: close }, '关闭此 tab'),
          h(Btn, { onClick: () => showToast('右侧栏 tab 内的 shell.overlay 通知') }, '触发通知'),
        ),
        h(HostSummary, { state, error }),
      );
    }

    // ---------------------------------------------------------------------
    // shell.overlay: shared detail modal + toast
    // ---------------------------------------------------------------------
    function ShellOverlayDemo() {
      const detail = useDetail();
      const toast = useToast();

      useEffect(() => {
        if (toast === null) return undefined;
        const timer = setTimeout(clearToast, 4200);
        return () => clearTimeout(timer);
      }, [toast]);

      useEffect(() => {
        if (detail === null) return undefined;
        const onKeyDown = (event) => {
          if (event.key === 'Escape') closeSlotDetail();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [detail]);

      const info = detail === null ? null : META[detail.key];

      return h(
        React.Fragment,
        null,
        detail === null
          ? null
          : h(
              'div',
              {
                className: 'sl-backdrop',
                onMouseDown: (event) => {
                  if (event.target === event.currentTarget) closeSlotDetail();
                },
              },
              h(
                'div',
                { className: 'sl-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': slotTitle(detail.key) },
                h(
                  'div',
                  { className: 'sl-modal-head' },
                  h(
                    'div',
                    { style: { minWidth: 0 } },
                    h('div', { className: 'sl-kicker' }, 'PLUGIN API GALLERY'),
                    h('h2', { className: 'sl-modal-title' }, slotTitle(detail.key)),
                    h('p', { className: 'sl-modal-sub' }, info ? info.desc : ''),
                  ),
                  h('button', { type: 'button', className: 'sl-icon-btn', onClick: closeSlotDetail, 'aria-label': '关闭' }, '×'),
                ),
                h(
                  'div',
                  { className: 'sl-modal-body' },
                  detail.extra,
                  h('div', { className: 'sl-code-title' }, '注册代码'),
                  h(CodeBlock, { code: info ? info.code : '' }),
                  h('p', { className: 'sl-modal-meta' }, `渲染于 shell.overlay · kind: ${info ? info.kind : '—'} · scope: ${info ? info.scope : '—'}`),
                ),
              ),
            ),
        toast === null
          ? null
          : h(
              'div',
              { className: 'sl-toast', role: 'status' },
              h('div', { className: 'sl-toast-kicker' }, slotTitle(SLOT.overlay)),
              h('div', null, toast.message),
            ),
      );
    }

    // ---------------------------------------------------------------------
    // Styles
    // ---------------------------------------------------------------------
    const CSS = `
.sl-page, .sl-page * { box-sizing: border-box; }
.sl-page {
  height: 100%; min-height: 0; overflow: auto; padding: 22px 26px 46px;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font-size: 13px; line-height: 1.55; font-family: inherit;
}
.sl-page-head { max-width: 780px; }
.sl-kicker { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
.sl-page-title { margin: 6px 0 4px; font-size: 20px; font-weight: 650; letter-spacing: -.01em; }
.sl-page-desc { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; max-width: 760px; }
.sl-tags { display: flex; gap: 6px; flex-wrap: wrap; margin: 10px 0 16px; }
.sl-tag { font-size: 10px; color: var(--dsw-alias-label-secondary); border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; padding: 1px 7px; }
.sl-extra { margin: 0 0 14px; }
.sl-note { margin: 0 0 10px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6; }
.sl-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 12px 0; }
.sl-btn {
  appearance: none; font: inherit; font-size: 12px; cursor: pointer; padding: 7px 10px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary);
}
.sl-btn:hover { border-color: var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); }
.sl-btn-primary { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: #fff; }
.sl-btn-primary:hover { filter: brightness(1.05); background: var(--dsw-alias-brand-primary); }
.sl-link { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11px; cursor: pointer; padding: 2px 4px; border-radius: 4px; }
.sl-link:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); }
.sl-code-title { font-size: 11px; color: var(--dsw-alias-label-secondary); margin: 16px 0 6px; }
.sl-code { position: relative; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 10px 12px; overflow: auto; max-height: 280px; }
.sl-code pre { margin: 0; padding-right: 44px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; line-height: 1.6; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; overflow-wrap: anywhere; }
.sl-copy { position: absolute; top: 6px; right: 6px; appearance: none; font: inherit; font-size: 10px; cursor: pointer; padding: 3px 7px; border-radius: 5px; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); }
.sl-copy:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.sl-footnote { margin: 10px 0 0; color: var(--dsw-alias-label-secondary); font-size: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.sl-kv { display: grid; grid-template-columns: minmax(90px, max-content) 1fr; gap: 4px 12px; margin: 12px 0; font-size: 12px; }
.sl-kv dt { color: var(--dsw-alias-label-secondary); }
.sl-kv dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.sl-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; }
.sl-menu-glyph { display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-brand-primary); flex: none; }
.sl-host { margin-top: 16px; border-top: 1px solid var(--dsw-alias-border-l1); padding-top: 12px; }
.sl-host-title { font-size: 12px; font-weight: 600; margin-bottom: 6px; }
.sl-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
.sl-table th { text-align: left; font-weight: 500; color: var(--dsw-alias-label-secondary); padding: 0 8px 5px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.sl-table td { padding: 5px 8px 5px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); vertical-align: top; overflow-wrap: anywhere; }
.sl-muted { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.sl-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; }
.sl-header-btn {
  appearance: none; display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 8px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: transparent;
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11px; cursor: pointer;
}
.sl-header-btn:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.sl-header-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-brand-primary); flex: none; }
.sl-dock {
  appearance: none; display: inline-flex; align-items: center; gap: 6px; max-width: max-content;
  padding: 3px 8px; margin: 2px 0 0; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px;
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 11px; cursor: pointer;
}
.sl-dock:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.sl-dock-mark { width: 15px; height: 15px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-brand-primary); font-size: 9px; }
.sl-dock-slot { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 9px; opacity: .7; }
.sl-mini-btn {
  appearance: none; width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1);
  background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 10px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.sl-mini-btn:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.sl-turn-tail {
  appearance: none; display: flex; align-items: center; gap: 8px; max-width: max-content;
  border: 1px dashed var(--dsw-alias-border-l1); border-radius: 6px; padding: 3px 8px;
  background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11px; cursor: pointer;
}
.sl-turn-tail:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.sl-turn-slot { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 9px; opacity: .7; }
.sl-row-badge {
  appearance: none; width: 14px; height: 14px; padding: 0; border-radius: 4px;
  border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-brand-primary); font: inherit; font-size: 8px; line-height: 1;
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
}
.sl-row-badge:hover { background: var(--dsw-alias-bg-layer-1); }
.sl-footer-btn {
  appearance: none; display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px; background: transparent;
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; cursor: pointer;
}
.sl-footer-btn:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.sl-footer-rail {
  appearance: none; width: 30px; height: 30px; padding: 0; border-radius: 7px;
  border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-secondary);
  display: inline-flex; align-items: center; justify-content: center; font: inherit; font-size: 10px; cursor: pointer;
}
.sl-footer-rail:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.sl-footer-icon { width: 16px; height: 16px; border-radius: 4px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-brand-primary); display: inline-flex; align-items: center; justify-content: center; font-size: 9px; flex: none; }
.sl-hero-btn {
  appearance: none; font: inherit; font-size: 11px; cursor: pointer; padding: 4px 9px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px;
  background: transparent; color: var(--dsw-alias-label-secondary);
}
.sl-hero-btn:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.sl-general-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 11px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.sl-general-row:last-child { border-bottom: 0; }
.sl-general-text { min-width: 0; }
.sl-general-title { font-size: 13px; color: var(--dsw-alias-label-primary); }
.sl-general-sub { font-size: 10px; color: var(--dsw-alias-label-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.sl-general-actions { display: flex; align-items: center; gap: 10px; flex: none; }
.sl-switch { appearance: none; width: 34px; height: 20px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); position: relative; cursor: pointer; padding: 0; }
.sl-switch span { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--dsw-alias-label-secondary); transition: left .15s ease; }
.sl-switch[aria-checked="true"] { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.sl-switch[aria-checked="true"] span { left: 16px; background: #fff; }
/* A-新增 18 + 安全 C 子集：通用 GalleryEntry 的 8 种 mode */
.sl-gen {
  appearance: none; font: inherit; cursor: pointer; max-width: 100%;
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px;
  background: transparent; color: var(--dsw-alias-label-secondary);
}
.sl-gen:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.sl-gen-glyph {
  width: 15px; height: 15px; border-radius: 4px; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-brand-primary); font-size: 9px;
}
.sl-gen-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sl-gen-slot { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 9px; opacity: .7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sl-gen-button { height: 26px; padding: 0 9px; font-size: 11px; }
.sl-gen-icon-button { width: 24px; height: 24px; padding: 0; justify-content: center; flex: none; }
.sl-gen-menu-item { width: 100%; justify-content: flex-start; border: 0; border-radius: 6px; padding: 6px 8px; font-size: 12px; }
.sl-gen-row { width: 100%; justify-content: flex-start; padding: 6px 8px; font-size: 12px; }
.sl-gen-inline { width: 100%; justify-content: flex-start; padding: 8px; font-size: 12px; border-style: dashed; }
.sl-gen-badge { padding: 1px 7px; border-radius: 999px; font-size: 10px; }
.sl-gen-link { border: 0; padding: 2px 4px; font-size: 11px; }
.sl-gen-link:hover { background: transparent; text-decoration: underline; }
.sl-gen-chip { padding: 2px 8px; border-radius: 999px; font-size: 11px; background: var(--dsw-alias-bg-layer-1); }
/* plugins.detail.section 的内联区块 */
.sl-gen-section { margin: 14px 0; padding: 10px 12px; border: 1px dashed var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); }
.sl-gen-section-title { margin: 0 0 4px; font-size: 13px; font-weight: 600; }
/* keyed：sidebar.right.pane.tab.title 的 chip */
.sl-pane-title { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }
.sl-pane-chip { width: 14px; height: 14px; border-radius: 3px; flex: none; display: inline-flex; align-items: center; justify-content: center; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-brand-primary); font-size: 8px; }
.sl-pane-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* keyed：sidebar.right.tab.guide.entry 的 guide 卡 */
.sl-guide-card { display: flex; flex-direction: column; gap: 2px; width: 100%; box-sizing: border-box; padding: 9px 10px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); cursor: pointer; }
.sl-guide-card:hover { border-color: var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); }
.sl-guide-title { font-size: 12px; font-weight: 600; }
.sl-guide-desc { font-size: 10px; color: var(--dsw-alias-label-secondary); }
/* keyed chat views: tool.call.toolview / conversation.chat.commandview */
.sl-chatview { display: flex; flex-direction: column; gap: 3px; padding: 6px 8px; border: 1px dashed var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); font-size: 11px; }
.sl-chatview-title { font-weight: 600; color: var(--dsw-alias-label-primary); }
.sl-chatview-sub { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; color: var(--dsw-alias-label-secondary); }
.sl-chatview-actions { margin-top: 2px; }
.sl-nonui { margin: 18px 0 8px; }
.sl-nonui-summary { padding: 14px 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.sl-nonui-summary-title { font-size: 15px; font-weight: 650; }
.sl-nonui-summary-sub { margin-top: 4px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6; }
.sl-nonui-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.sl-search { display: flex; align-items: center; gap: 8px; margin: 14px 0; }
.sl-input {
  flex: 1; min-width: 0; font: inherit; font-size: 12px; padding: 8px 10px; border-radius: 7px;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
}
.sl-input:focus { outline: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent); outline-offset: 1px; border-color: var(--dsw-alias-brand-primary); }
.sl-nonui-group { margin: 20px 0 24px; }
.sl-nonui-group-head h2 { margin: 0; font-size: 14px; font-weight: 650; }
.sl-nonui-group-head p { margin: 4px 0 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6; }
.sl-nonui-list { display: flex; flex-direction: column; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; overflow: hidden; background: var(--dsw-alias-bg-layer-1); }
.sl-nonui-row { border-bottom: 1px solid var(--dsw-alias-border-l1); }
.sl-nonui-row:last-child { border-bottom: 0; }
.sl-nonui-row > summary { display: flex; align-items: baseline; gap: 10px; padding: 8px 12px; cursor: pointer; list-style: none; }
.sl-nonui-row > summary::-webkit-details-marker { display: none; }
.sl-nonui-row > summary:hover { background: var(--dsw-alias-bg-layer-2); }
.sl-nonui-name { flex: none; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: var(--dsw-alias-label-primary); }
.sl-nonui-reason { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-secondary); font-size: 11px; }
.sl-nonui-body { padding: 2px 12px 12px; background: var(--dsw-alias-bg-base); }
.sl-nonui-reason-full { margin: 8px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6; }
.sl-nonui-region { flex: none; font-size: 10px; color: var(--dsw-alias-brand-primary); border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent); border-radius: 999px; padding: 1px 7px; }
.sl-nonui-breadcrumb { margin: 8px 0 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.sl-nonui-where { margin: 0 0 8px; padding: 6px 8px; border-left: 2px solid var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 1.6; }
.sl-map { margin: 14px 0 4px; padding: 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
.sl-map-caption { margin-bottom: 8px; color: var(--dsw-alias-label-secondary); font-size: 11px; }
.sl-map-row { display: flex; gap: 6px; margin: 6px 0; }
.sl-map-columns { display: grid; grid-template-columns: 1fr 1.4fr 1fr; gap: 8px; margin: 6px 0; }
.sl-map-col { display: flex; flex-direction: column; gap: 6px; padding: 8px; border: 1px dashed var(--dsw-alias-border-l1); border-radius: 8px; }
.sl-map-col-title { color: var(--dsw-alias-label-secondary); font-size: 10px; letter-spacing: .04em; }
.sl-map-region {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  width: 100%; padding: 6px 8px; border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 6px; background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11px; cursor: pointer;
}
.sl-map-region:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.sl-map-region.is-active { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, var(--dsw-alias-bg-layer-2)); }
.sl-map-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sl-map-count { flex: none; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; color: var(--dsw-alias-label-secondary); }
.sl-map-where { margin-top: 8px; color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 1.6; }
@media (max-width: 760px) {
  .sl-map-columns { grid-template-columns: 1fr; }
}
.sl-tabs { display: flex; gap: 2px; margin: 14px 0 10px; border-bottom: 1px solid var(--dsw-alias-border-l1); overflow-x: auto; }
.sl-tab {
  appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary);
  padding: 8px 12px; cursor: pointer; font: inherit; font-size: 12px; white-space: nowrap;
  border-bottom: 2px solid transparent;
}
.sl-tab:hover { color: var(--dsw-alias-label-primary); }
.sl-tab[aria-selected="true"] { color: var(--dsw-alias-label-primary); border-bottom-color: var(--dsw-alias-brand-primary); font-weight: 600; }
.sl-ref-row { border-bottom: 1px solid var(--dsw-alias-border-l1); }
.sl-ref-row:last-child { border-bottom: 0; }
.sl-ref-row > summary { display: flex; align-items: baseline; gap: 10px; padding: 8px 12px; cursor: pointer; list-style: none; }
.sl-ref-row > summary::-webkit-details-marker { display: none; }
.sl-ref-row > summary:hover { background: var(--dsw-alias-bg-layer-2); }
.sl-ref-name { flex: none; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: var(--dsw-alias-label-primary); }
.sl-ref-mode { flex: none; font-size: 10px; color: var(--dsw-alias-label-secondary); border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; padding: 1px 7px; }
.sl-ref-used { flex: none; font-size: 10px; color: var(--dsw-alias-brand-primary); border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, transparent); border-radius: 999px; padding: 1px 7px; }
.sl-ref-desc { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-secondary); font-size: 11px; }
.sl-ref-body { padding: 2px 12px 12px; background: var(--dsw-alias-bg-base); }
.sl-ref-desc-full { margin: 6px 0 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6; }
.sl-ref-code { margin-top: 8px; }
.sl-ref-token { display: flex; align-items: baseline; gap: 10px; padding: 8px 12px; }
.sl-backdrop { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,.38); pointer-events: auto; }.sl-modal { width: min(700px, 100%); max-height: 86vh; overflow: auto; border-radius: 12px; padding: 20px 22px; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); box-shadow: 0 20px 60px rgba(0,0,0,.28); }
.sl-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.sl-modal-title { margin: 4px 0 2px; font-size: 16px; font-weight: 650; letter-spacing: -.01em; }
.sl-modal-sub { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.55; }
.sl-icon-btn { appearance: none; width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--dsw-alias-border-l1); background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 16px; line-height: 1; cursor: pointer; flex: none; }
.sl-icon-btn:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-border-l2); }
.sl-modal-body { margin-top: 12px; }
.sl-modal-meta { margin: 10px 0 0; font-size: 10px; color: var(--dsw-alias-label-secondary); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.sl-toast { position: fixed; right: 22px; bottom: 22px; z-index: 110; max-width: 340px; padding: 11px 14px; border-radius: 10px; background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); border: 1px solid var(--dsw-alias-border-l2); box-shadow: 0 12px 32px rgba(0,0,0,.24); font-size: 12px; pointer-events: auto; }
.sl-toast-kicker { font-size: 10px; color: var(--dsw-alias-label-secondary); margin-bottom: 3px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
@media (max-width: 760px) {
  .sl-page { padding: 16px 16px 36px; }
  .sl-page-title { font-size: 18px; }
  .sl-backdrop { padding: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .sl-page *, .sl-modal * { transition: none !important; animation: none !important; }
}
`;

    // ---------------------------------------------------------------------
    // Client plugin body
    // ---------------------------------------------------------------------
    return {
      inject: ['slots'],
      apply(ctx) {
        runtime = ctx;

        ctx.effect(() => {
          const style = document.createElement('style');
          style.dataset.dshPlugin = PLUGIN_ID;
          style.textContent = CSS;
          document.head.appendChild(style);
          return () => style.remove();
        }, 'api-gallery: stylesheet');

        const register = (key, id, component, withLabel) => {
          ctx.slots.inject(key, () =>
            ctx.slots.register(
              {
                name: key,
                id,
                order: 50,
                ...(withLabel ? { label: () => slotTitle(key) } : {}),
              },
              component,
            ),
          );
        };

        register(SLOT.view, OPEN_IDS.view, ConversationViewDemo, true);
        register(SLOT.header, OPEN_IDS.header, HeaderUtilitiesDemo, true);
        register(SLOT.dock, OPEN_IDS.dock, ComposerDockDemo, true);
        register(SLOT.inputLeft, OPEN_IDS.inputLeft, InputLeftDemo, true);
        register(SLOT.inputRight, OPEN_IDS.inputRight, InputRightDemo, true);
        register(SLOT.assistant, OPEN_IDS.assistant, AssistantActionDemo, true);
        register(SLOT.turnTail, OPEN_IDS.turnTail, TurnTailDemo, true);
        register(SLOT.sessionRow, OPEN_IDS.sessionRow, SessionRowLeadingDemo, true);
        register(SLOT.footer, OPEN_IDS.footer, FooterActionDemo, true);
        register(SLOT.settings, OPEN_IDS.settings, SettingsSectionDemo, true);
        register(SLOT.general, OPEN_IDS.general, SettingsGeneralRowDemo, false);
        register(SLOT.pluginsTab, OPEN_IDS.pluginsTab, SettingsPluginsTabDemo, true);
        register(SLOT.overlay, OPEN_IDS.overlay, ShellOverlayDemo, false);
        register(SLOT.hero, OPEN_IDS.hero, HeroOptionDemo, true);

        // A-新增 18 的 15 个通用 list + 安全 C 子集的 5 个 list。Each one is
        // register-with-label via the data-driven GalleryEntry component.
        for (const entry of GENERIC_SLOTS) {
          ctx.slots.inject(entry.slot, () =>
            ctx.slots.register(
              {
                name: entry.slot,
                id: entry.id,
                order: entry.order,
                label: () => slotTitle(entry.slot),
              },
              (props) => h(GalleryEntry, { ...props, entry }),
            ),
          );
        }

        // Bespoke A6 / A10.
        ctx.slots.inject('plugins.tab', () =>
          ctx.slots.register(
            {
              name: 'plugins.tab',
              id: 'api-gallery-plugins-page-tab',
              order: 60,
              label: () => slotTitle('plugins.tab'),
            },
            PluginsTabDemo,
          ),
        );

        ctx.slots.inject('plugins.detail.section', () =>
          ctx.slots.register(
            {
              name: 'plugins.detail.section',
              id: 'api-gallery-detail-section',
              order: 50,
              label: () => slotTitle('plugins.detail.section'),
            },
            PluginsDetailSectionDemo,
          ),
        );

        // Last two decision pairs:
        //  - sidebar.panellist icon + main keyed panel (id === key)
        //  - tool.call.toolview keyed by the Host tool name
        //  - conversation.chat.commandview keyed by the Host command name
        ctx.slots.inject(SLOT.panelList, () =>
          ctx.slots.register(
            {
              name: SLOT.panelList,
              id: OPEN_IDS.panel,
              order: 50,
              label: () => slotTitle(SLOT.panelList),
            },
            PanelIcon,
          ),
        );

        ctx.slots.inject(SLOT.main, () =>
          ctx.slots.register(
            {
              name: SLOT.main,
              key: OPEN_IDS.panel,
            },
            MainPanelDemo,
          ),
        );

        ctx.slots.inject(SLOT.toolView, () =>
          ctx.slots.register(
            {
              name: SLOT.toolView,
              key: 'api_gallery_demo',
            },
            ToolViewDemo,
          ),
        );

        ctx.slots.inject(SLOT.commandView, () =>
          ctx.slots.register(
            {
              name: SLOT.commandView,
              key: 'api-gallery',
            },
            CommandViewDemo,
          ),
        );

        // The composer + menu and the / menu share one candidate list. This is
        // a client-service contribution, not a Slot: ui-commands places any
        // unlisted contribution at the end of its "Commands" section.
        ctx.inject(['commandUi'], (scope) => {
          const commandUi = scope.get('commandUi');
          scope.effect(
            () =>
              commandUi.register({
                name: 'api-gallery-demo',
                label: () => slotTitle(COMMAND_UI),
                description: () => '客户端命令菜单扩展（不是 Slot）',
                icon: GalleryMenuIcon,
                available: () => true,
                ui: {
                  kind: 'action',
                  run: () => openSlotDetail(COMMAND_UI, h(CommandUiExtra)),
                },
              }),
            'api-gallery: commandUi action',
          );
        });

        // Native right sidebar: a tab type plus the keyed body slot. The type
        // registry is the native DSH service, not better-sidebar.
        const tabs = ctx.get('sidebarRightTabs');
        if (tabs !== undefined) {
          ctx.effect(
            () =>
              tabs.register({
                id: RIGHT_TAB_ID,
                kind: RIGHT_TAB_KIND,
                priority: 'extension',
                title: () => slotTitle(SLOT.rightTab),
                guide: [
                  {
                    id: 'demo',
                    order: 100,
                    title: () => '图鉴demo',
                    description: () => '原生右侧栏 tab：sidebarRightTabs.register + sidebar.right.pane.tab',
                  },
                ],
              }),
            'api-gallery: native right tab type',
          );

          ctx.slots.inject('sidebar.right.pane.tab', () =>
            ctx.slots.register(
              {
                name: 'sidebar.right.pane.tab',
                key: RIGHT_TAB_ID,
              },
              RightSidebarTabDemo,
            ),
          );

          // A15（keyed，与 body 同 key）：只画自家 tab 的 chip 标题。
          ctx.slots.inject('sidebar.right.pane.tab.title', () =>
            ctx.slots.register(
              {
                name: 'sidebar.right.pane.tab.title',
                key: RIGHT_TAB_ID,
              },
              PaneTabTitleDemo,
            ),
          );

          // C8（keyed）：自家 tab provider 的 guide 卡。key 使用自家 tab id；
          // live Slots.listSubTree 已确认 owner 按该 key 派发（occupant active）。
          ctx.slots.inject('sidebar.right.tab.guide.entry', () =>
            ctx.slots.register(
              {
                name: 'sidebar.right.tab.guide.entry',
                key: RIGHT_TAB_ID,
              },
              GuideEntryDemo,
            ),
          );
        }
      },
    };
  },
});

