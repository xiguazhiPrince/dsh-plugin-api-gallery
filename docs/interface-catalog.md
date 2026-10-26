# DSH 插件接口目录

> 扫描自运行的 DSH **0.2.1-rc.3**（2026-10-26），来源：cordis_inspect_query (Service / Event / Slots / Theme / Builtin)。
> 本文件由 `scripts/build-docs.cjs` 从 `catalog.json` 生成；接口会随 DSH 版本变化，写代码前请用 `cordis_inspect_query` 复核。
> **版本列** = 该接口首次出现在 DSH release 的版本（由 `scripts/build-versions.cjs` 从各 release tag 的生成式 inspect 目录计算）；`≤ X` 表示最早追踪版本 X 之前就存在。

## 统计

| 类别 | 数量 |
| --- | ---: |
| Host Service | 98 |
| Host Event | 76 |
| Client Service | 8 |
| Client Event | 4 |
| Client Builtin | 5 |
| Slot | 103 |
| Factory | 6 |
| Theme token | 14 |

## 先选型：我想做什么？

| 需求 | 首选接口 | 说明 |
| --- | --- | --- |
| 加一个按钮 / 页面 / 徽标 / Toast | `ctx.slots.register` | 先选 Slot，再决定组件；不要在 `document.body` 上自绘。 |
| 读会话、工作区、模型、任务状态 | Host/Client Service | 用 `ctx.get("name")` 并判空；需要强依赖才用 `inject`。 |
| 在模型调用工具前后做事 | `tools/pre-execute` / `tools/post-execute` / `tools/execute` | waterfall 必须 `return next()`；只观察用 `tools/result`。 |
| 给模型一个新的能力 | `ctx.tools.register` | 工具 schema + `output.render`；UI 卡片由 Chat 渲染。 |
| 加人工斜杠命令 | `ctx.commands.register` | handler 直接返回文本，不发起模型请求。 |
| 改模型看到的提示词 | `ctx.systemPrompt.section` | 稳定事实用 section；按会话上下文用 `ctx.systemPrompt.context`。 |
| 给 UI 提供 Host 数据 | `ctx.webServer.register` + `fetch` | 持久化 bundle 没有 `host.call`；同源 JSON 路由是官方做法。 |
| 改主题 / 加语言 | `ctx.theme` / `ctx.locale` | 令牌 `--dsw-alias-*`；界面文字走 locale。 |
| 切面板 / 开关侧栏 | `ctx.layout` | `selectPanel` / `toggleSidebar` / `openRightbar`。 |
| 存插件自己的数据 | `ctx.storage` / `ctx.storageDomain` | 不要往 Session 里塞新事件类型。 |
| 定时 / 目标 / 子代理 | `ctx.schedule` / `ctx.goals` / `ctx.subagents` | 都是 Host 服务，注意 Session 绑定。 |

## 最小插件骨架

```json
{
  "name": "my-plugin",
  "type": "module",
  "exports": { ".": "./index.js", "./client": "./client.js" },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": { "platform": "web", "immediately": true }
  }
}
```

```yaml
# cordis.patch.yml
- insert:
    - id: my-plugin
      name: 'my-plugin'
```

```js
// index.js — Host 半
export const name = "my-plugin";
export const inject = ["webServer"];
export function apply(ctx, config) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: "/my-plugin",
    handler: (req, res) => { res.end(JSON.stringify({ ok: true })); },
  }));
  ctx.on("tools/pre-execute", (exec, next) => next());
}
```

```js
// client.js — 浏览器半（无构建、无 JSX）
window.__ModuleLoader__.load({
  id: "my-plugin",
  factory(require) {
    const React = require("react");
    return {
      inject: ["slots"],
      apply(ctx) {
        ctx.slots.inject("main", () => ctx.slots.register(
          { name: "main", key: "my-panel" },
          () => React.createElement("div", null, "Hello"),
        ));
      },
    };
  },
});
```

## 持久化 bundle vs 动态 cordis 包

| 能力 | 持久化 bundle（本示例） | 动态 cordis 包（cordis_define） |
| --- | --- | --- |
| Slot / Service / Event | 支持 | 支持 |
| Browser → Host 调用 | `ctx.webServer.register` + `fetch` | `host.call(method, args)` + `harness.handle` |
| 样式 | 包自己插入 `<style>` / React 元素 | `styles.insert(css)` |
| 日志 | `console` | 包标签 `console` |
| 生命周期 | Loader entry / HMR | 运行时 Package / run surface |

## Host Services

98 个。部分条目被分布式 Slot demo 或 Settings/右侧栏的 Host 快照读取；没有 Demo 的服务通常需要具体业务上下文或会产生副作用，目录里保留了完整方法签名。

### agentDefaultModel

Owns the default model selection independently of any Host or transport.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
currentSelection(): ModelSelection
async saveSelection(next: ModelSelection): Promise<void>
```

</details>

### agentLoop

Concrete agent factory and driver service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
readonly config: Config
async create(id: SessionId, options: AgentOptions = {}, meta: Pick<SessionHeader, 'cwd'> = {}): Promise<Agent>
async createAgent(ownerCtx: Context, options: CreateAgentOptions): Promise<AgentHandle>
async resume(ownerCtx: Context, options: ResumeAgentOptions): Promise<AgentHandle>
```

</details>

### agentPresets

Registry of YAML-declared presets and the revisions live Agents retain.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
async register(definition: PresetDefinition): Promise<() => Promise<void>>
inspectCompositions(ctx?: Context): AgentPresetInspection[]
async list(): Promise<AgentPreset[]>
@Remote('list') async remoteExportList(): Promise<AgentPresetRoster>
async resolve(id?: string): Promise<AgentPreset>
@Remote('read') readDocument(agentPreset: string): Promise<AgentPresetDocument>
async mount(ctx: Context, id?: string): Promise<AgentPreset>
composeFrom(ctx: Context, parent: Context): string | undefined
composedPreset(ctx: Context): string | undefined
serviceFor<K extends string & keyof Context>(agent: { ctx: Context }, name: K): Context[K] | undefined
async recompose(ctx: Context, id: string): Promise<AgentPreset>
@Remote('select') async select(agent: Agent, agentPreset: string): Promise<string>
async acquireScope(id?: string): Promise<{ key: ScopeKey } & AsyncDisposable>
compositionInventory(): Promise<AgentPresetComposition[]>
```

</details>

### agents

Agent service (`ctx.agents`): tracks live agents and carries the initiating Agent through one process-local asynchronous driver chain.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：Settings 页 / 原生右侧栏 tab 的实时快照

<details><summary>方法签名</summary>

```ts
currentInitiator(): Agent | undefined
requireInitiator(): Agent
withInitiator<T>(agent: Agent, operation: () => T): T
withoutInitiator<T>(operation: () => T): T
setFactory(factory: AgentFactory): () => void
async create(options: CreateAgentOptions): Promise<AgentHandle>
async resume(options: ResumeAgentOptions): Promise<AgentHandle>
register(agent: Agent): ReturnType<Context['effect']>
enter(agent: Agent, owner: Agent | undefined): () => void
async announce(agent: Agent, source: SessionStartSource, signal?: AbortSignal): Promise<void>
get(id: SessionId): Agent | undefined
isOwnedBy(id: SessionId, owner: Agent): boolean
list(): Agent[]
roots(): Agent[]
```

</details>

```js
const service = ctx.get('agents');
if (service !== undefined) {
  // currentInitiator(): Agent | undefined
}
```

### agentTeams

Agent Teams service backed by the exact live Lead Session log.

**首次出现**：0.1.0-rc.8

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
membership(agent: Agent): TeamMembership
listMembers(agent: Agent): TeamMemberView[]
async spawnTeammate(caller: Agent, request: SpawnTeammateRequest): Promise<SpawnTeammateResult>
async sendMessage(caller: Agent, request: SendTeamMessageRequest): Promise<SendTeamMessageResult>
async createTask(caller: Agent, request: CreateTeamTaskRequest): Promise<TeamTaskView>
getTask(caller: Agent, id: TeamTaskId): TeamTaskView
listTasks(caller: Agent): TeamTaskView[]
async updateTask(caller: Agent, request: UpdateTeamTaskRequest): Promise<TeamTaskView>
async waitForChange(caller: Agent, timeoutMs: number, signal: AbortSignal): Promise<TeamWaitResult>
interrupt(caller: Agent, targetName: string): { previousStatus: 'running' | 'inactive' }
tryMembership(agent: Agent): TeamMembership | undefined
```

</details>

### approval

Approval service that applies session policy before answerers and logs every ask/outcome pair to the requesting session.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
setPolicy(agent: Agent, policy: ApprovalPolicy): void
async request(req: ApprovalRequest): Promise<ApprovalOutcome>
overrideOf(session: Session): ApprovalPolicy | undefined
```

</details>

### attachments

Immutable binary attachment service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract readonly imageLimits: ImageAttachmentLimits
abstract validateImage(input: SaveImageAttachment): Promise<void>
async saveImages(inputs: readonly SaveImageAttachment[]): Promise<readonly ImageAttachmentRef[]>
async admitPromptContent( content: readonly AttachmentAdmissionPart[], ): Promise<AdmittedPromptContentPart[]>
admitEncodedFile(input: EncodedFileAttachment): Promise<FileAttachmentRef>
isAttachmentError(error: unknown): error is AttachmentError
abstract saveImage(input: SaveImageAttachment): Promise<ImageAttachmentRef>
abstract readImage(ref: ImageAttachmentRef, signal?: AbortSignal): Promise<StoredImageAttachment>
imageHostPath(ref: ImageAttachmentRef): string | undefined
saveFile(input: SaveFileAttachment): Promise<FileAttachmentRef>
saveFileStream(input: SaveFileStreamAttachment): Promise<FileAttachmentRef>
async *readFileStream( ref: FileAttachmentRef, signal?: AbortSignal, ): AsyncIterable<Uint8Array>
fileHostPath(ref: FileAttachmentRef): string | undefined
readImageRequest( ref: ImageAttachmentRef, target: ImageRequestTarget, signal?: AbortSignal, ): Promise<RequestImageAttachment>
```

</details>

### authorization

`ctx.authorization`: a registry of credential-obtaining flows, one attempt at a time per key.

**首次出现**：0.1.1-rc.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
registerFlow(flow: AuthorizationFlow): () => void
list(): readonly AuthorizationEntry[]
describe(key: CredentialKey): AuthorizationEntry | undefined
cancel(key: CredentialKey): void
async begin(request: AuthorizationRequest): Promise<AuthorizationOutcome>
```

</details>

### browserUse

Owns one optional provider registration in the shared browser-use service.

**首次出现**：0.1.6-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
register(name: BrowserUseProviderName): () => Promise<void>
```

</details>

### claudeCodeMods

The bridge service: loaded mods, their hooks, and the harness listeners that raise their events.

**首次出现**：0.2.1-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote({ mode: 'stream' }) watchBand(agent: Agent, signal: AbortSignal): AsyncIterable<SurfaceSnapshot>
@Remote pressBand(agent: Agent, generation: number, actionId: string): Promise<SurfaceSnapshot>
async add(definition: ModDefinition): Promise<() => Promise<void>>
```

</details>

### clientModules

The web plugin table service: incremental `dsh.client` scan + wire composition + bundle route + index injection rows.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
graph(): WebBootGraph
clientPath(id: string): string | undefined
async fetchBundle(request: Request): Promise<Response>
artifactBaseline(id: string): ClientArtifactBaseline | undefined
rebuilt(id: string): string | undefined
onRebuilt(listener: (id: string, rev: string) => void): () => void
onGraphChanged(listener: () => void): () => void
```

</details>

### commands

Human-command registry.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
register(definition: CommandDefinition): () => void
registerFileReceiptResolver(resolver: CommandFileReceiptResolver): () => void
@Remote list(agent: Agent): readonly CommandDescriptor[]
find(agent: Agent, name: string): CommandDefinition | undefined
@Remote async execute( agent: Agent, line: string, submittedAttachments: readonly CommandSubmitAttachment[], signal: AbortSignal, ): Promise<CommandExecution | undefined>
```

</details>

### compaction

Abstract compaction service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract compactIfNeeded( agent: CompactionAgentContext, trigger: CompactionTrigger, signal: AbortSignal, ): Promise<CompactionResult | null>
abstract compactNow( agent: ManualCompactAgentContext, signal: AbortSignal, sourceCommandId?: CommandId, ): Promise<CompactionResult | null>
abstract compactRegion( start: SessionSeq, end: SessionSeq, agent: CompactionAgentContext, signal?: AbortSignal, ): Promise<CompactionResult>
```

</details>

### computerUse

Owns one optional provider registration in the shared computer-use service.

**首次出现**：0.1.6-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
register(name: ComputerUseProviderName): () => Promise<void>
```

</details>

### configEditor

Persist complete raw configs and apply them through the normal Loader path.

**首次出现**：0.1.7-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
entries(): Entry[]
configuration(): Array<{ entry: Entry; inherited: Record<string, unknown>; override: Record<string, unknown> }>
async edit( entry: Entry, change: (current: Record<string, unknown>, inherited: Record<string, unknown>) => Record<string, unknown>, ): Promise<void>
```

</details>

### connection

Host `ctx.connection` members consumed by transport-independent adapters.

**首次出现**：0.1.6-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
readonly rpc: HostConnectionRpc
readonly fetch: HostConnectionFetch
readonly browserPeer: PeerScope
readonly allowsRemoteAuthorities: boolean
createSharedFetchHandler(channel: '/api'): ConnectionFetchHandler
requestRejection(request: ConnectionTrustRequest): ConnectionRequestRejection
admit(request: ConnectionTrustRequest): PeerAdmission
createPeer(options: { readonly principal: Principal; readonly interactions?: 'answer' | 'none' }): PeerScope
admitConnection(request: ConnectionTrustRequest): ConnectionAdmission
authorizeIndex(request: ConnectionIndexRequest, response: ConnectionIndexResponse): boolean
authenticatedUrl(baseUrl: string): string
```

</details>

### cotTranslation

Optional reasoning translation delegates Session-bound storage to the translator.

**首次出现**：0.2.1-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote async limits(signal: AbortSignal): Promise<CotTranslationSnapshot>
@Remote async translate(request: TranslationRequest, signal: AbortSignal): Promise<string>
```

</details>

### credentials

Abstract credential service over two key spaces that answer two questions.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract resolve(ref: CredentialRef): Promise<ResolvedCredential | undefined>
abstract describe(ref: CredentialRef): Promise<CredentialInfo>
abstract set(ref: CredentialRef, value: string): Promise<void>
abstract unset(ref: CredentialRef): Promise<void>
abstract readRecord(key: CredentialKey): Promise<CredentialRecord | undefined>
abstract describeRecord(key: CredentialKey): Promise<CredentialRecordInfo>
abstract listRecords(): Promise<readonly CredentialRecordEntry[]>
abstract modifyRecord( key: CredentialKey, mutate: (current: CredentialRecord | undefined) => Promise<CredentialRecord | undefined>, ): Promise<CredentialRecord | undefined>
abstract deleteRecord(key: CredentialKey): Promise<void>
```

</details>

### credentialsController

Host service backing the generated `ctx.remote.credentials` namespace.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote async describe(refs: string[]): Promise<Record<string, CredentialInfo>>
@Remote async set(ref: string, value: string): Promise<void>
@Remote async unset(ref: string): Promise<void>
```

</details>

### deepseekAccount

Account operations; only Host consumers can obtain a request credential.

**首次出现**：0.1.7-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract getState(): Promise<AccountView>
abstract getProfile(client: AccountClientMetadata): Promise<AccountDetails['profile'] | null>
abstract getBalance(client: AccountClientMetadata): Promise<AccountDetails['balance'] | null>
abstract getUnnotifiedBonuses(client: AccountClientMetadata): Promise<AccountBonusBatch | null>
abstract ackBonusNotified(accountId: AccountUserId, orderId: AccountBonusOrderId, client: AccountClientMetadata): Promise<boolean>
abstract startSignIn(client: AccountClientMetadata, callbackOrigin: string, loginSource: 'web' | 'desktop'): Promise<AccountView>
abstract cancelSignIn(id: SignInAttemptId): Promise<AccountView>
abstract signOut(client: AccountClientMetadata): Promise<AccountView>
abstract watch(signal: AbortSignal, includeIdentityChanges?: boolean): AsyncIterable<AccountView>
abstract resolveToken(url: string): Promise<string | undefined>
abstract rejectToken(token: string): Promise<void>
abstract getPlatformSession(): Promise<PlatformSession | null>
abstract getDeviceIdentity(): Promise<{ deviceId?: string; userId?: AccountUserId; osVersion: string }>
```

</details>

### deepseekLlmApiExtensions

Registry of independently owned top-level fields for official DeepSeek requests.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
register<K extends keyof DeepSeekLlmApiExtensionMap>( field: K, provider: DeepSeekLlmApiExtensionProvider<DeepSeekLlmApiExtensionMap[K]>, ): () => Promise<void>
async prepare(request: DeepSeekLlmApiExtensionRequest): Promise<PreparedDeepSeekLlmApiExtensions>
```

</details>

### directoryPicker

Abstract directory-picking service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract capability(): DirectoryPickerCapability
```

</details>

### directoryPickerController

Host service backing the generated `ctx.remote.directoryPicker` namespace.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote('pick') async pick(signal: AbortSignal): Promise<string | null>
@Remote('list') async list(path: string | undefined, signal: AbortSignal): Promise<DirectoryListing>
@Remote('createDirectory') async createDirectory(path: string, name: string): Promise<string>
```

</details>

### fileReferences

Host capability for cancellable file-reference discovery.

**首次出现**：0.1.0-rc.8

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract list( agent: Agent, query: string, signal: AbortSignal, ): Promise<FileReferenceCandidate[]>
```

</details>

### fileUploads

Host service owning upload storage and receipts keyed by each receiving Agent's exact Session.

**首次出现**：0.1.3-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
registerAgentResolver(resolve: AgentResolver): () => void
@Remote('upload') upload(agent: Agent, request: EncodedFileUploadRequest, signal: AbortSignal): Promise<FileUploadValue>
async uploadStream(request: { readonly sessionId: SessionId readonly data: AsyncIterable<Uint8Array> readonly signal?: AbortSignal readonly name?: string }): Promise<FileUploadValue>
resolve(agent: Agent, receiptId: FileUploadReceiptId): FileAttachmentRef | undefined
bindPrompt( agent: Agent, receiptIds: readonly FileUploadReceiptId[], requestId: string, ): PromptFileBinding
retirePrompt(agent: Agent, requestId: string): void
```

</details>

### fs

Abstract filesystem provider.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
watch(target: FsTarget, changed: (error?: Error) => void, signal: AbortSignal): Promise<() => Promise<void>>
abstract resolve(path: string, opts?: { cwd?: string; signal?: AbortSignal }): Promise<FsTarget>
abstract processPath(target: FsTarget): string
processPathFromHostPath(hostPath: string): string | undefined
abstract fileUrl(target: FsTarget): string
abstract contains(parent: FsTarget, child: FsTarget): boolean
abstract stat(target: FsTarget, signal?: AbortSignal): Promise<FsInfo | undefined>
abstract lstat(path: string, opts?: { cwd?: string }, signal?: AbortSignal): Promise<FsPathInfo | undefined>
abstract readText(target: FsTarget, signal?: AbortSignal): Promise<string>
abstract streamText(target: FsTarget, signal?: AbortSignal): Promise<AsyncIterable<string>>
abstract readBytes(target: FsTarget, signal: AbortSignal | undefined, maxBytes: number): Promise<Uint8Array>
abstract readByteRange(target: FsTarget, range: { offset: number; length: number }, signal?: AbortSignal): Promise<Uint8Array>
abstract listDir(target: FsTarget, signal?: AbortSignal): Promise<FsDirEntry[]>
abstract writeText( target: FsTarget, content: string, expected?: FsWriteIntent, signal?: AbortSignal, sandboxPolicy?: SandboxExecutionPolicy, ): Promise<FsWriteOutcome>
abstract editText( target: FsTarget, edit: FsEditRequest, expected?: { version: FsVersion }, signal?: AbortSignal, sandboxPolicy?: SandboxExecutionPolicy, ): Promise<FsEditOutcome>
```

</details>

### goals

Goal service (`ctx.goals`) backed exclusively by the owning session log.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：Settings 页 / 原生右侧栏 tab 的实时快照

<details><summary>方法签名</summary>

```ts
@Remote('get') get(agent: Agent): GoalView | undefined
disarm(agent: Agent): GoalView | undefined
create(agent: Agent, request: CreateGoalRequest): GoalView
@Remote('edit') edit(agent: Agent, ref: GoalRef, request: EditGoalRequest): GoalView
@Remote('pause') pause(agent: Agent, ref: GoalRef): GoalView
@Remote('resume') resume(agent: Agent, ref: GoalRef): GoalView
@Remote('complete') complete(agent: Agent, ref: GoalRef): GoalView
block(agent: Agent, ref: GoalRef, reason: GoalBlockReason): GoalView
@Remote('clear') clear(agent: Agent, ref: GoalRef): GoalRef
@Remote('create') remoteExportCreate(agent: Agent, request: CreateGoalRequest): CreateGoalResult
```

</details>

```js
const service = ctx.get('goals');
if (service !== undefined) {
  // @Remote('get') get(agent: Agent): GoalView | undefined
}
```

### hmr

Hot reload service with Cordis-compatible module configuration and events.

**首次出现**：0.1.6-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
public baseDir: string
runExclusive<T>(operation: () => Promise<T>): Promise<T>
async watchConfig(filename: string, refresh: () => Promise<void>): Promise<() => Promise<void>>
getOuterStack: () => string[] = () => []
async getLinked(url: string): Promise<string[]>
async reconcileProfile(requiredIds: readonly string[] = []): Promise<ProfileReconciliation>
```

</details>

### inspector

Shared Host/Client service façade over the realm's source publisher.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
publish(topic: string, payload: InspectorJsonValue, monotonicMs?: number): void
readonly cordis: CordisRuntimeTreeReader
```

</details>

### jobController

Host service backing the generated `ctx.remote.job` namespace.

**首次出现**：0.1.7-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote({ mode: 'stream' }) list(request: JobListRequest, signal: AbortSignal): AsyncIterable<JobListFrame>
@Remote({ mode: 'stream' }) follow(request: JobFollowRequest, signal: AbortSignal): AsyncIterable<JobFollowFrame>
@Remote('kill') kill(request: JobKillRequest): JobKillValue
```

</details>

### jobs

Abstract background job registry.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract readonly events: JobEvents
abstract start(spec: JobSpec): JobId
abstract list(caller?: SessionId): JobView[]
abstract get(id: JobId, caller?: SessionId): JobView
abstract read(id: JobId, caller?: SessionId): JobRead
abstract readAt(id: JobId, from: number, caller?: SessionId): JobOutputRead
abstract kill(id: JobId, caller?: SessionId, reason?: string): 'requested' | 'already-finished'
abstract wait(id: JobId, timeoutMs: number, caller?: SessionId, signal?: AbortSignal): Promise<JobView>
abstract remove(id: JobId, caller?: SessionId): void
abstract attachController(name: string): () => void
```

</details>

### llm

The abstract `llm` service: an adapter registry plus a streaming model-call API, interceptable via the `llm/stream` waterfall.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
registerAdapter(providers: string[], adapter: LlmAdapter): AdapterRegistrationHandle
@Remote listProviders(): LlmProviderInfo[]
registerConfigurableProviders(entries: readonly LlmConfigurableProvider[]): DirectoryRegistrationHandle
@Remote listConfigurableProviders(): LlmConfigurableProvider[]
registerModelDiscovery( settingsNs: string, discover: ( request: LlmModelDiscoveryRequest, signal?: AbortSignal, ) => Promise<readonly LlmDiscoveredModel[]>, ): () => void
async discoverModels( settingsNs: string, request: LlmModelDiscoveryRequest, signal?: AbortSignal, ): Promise<LlmDiscoveredModel[]>
@Remote('discoverModels') async remoteDiscoverModels( settingsNs: string, request: LlmModelDiscoveryRequest, signal: AbortSignal, ): Promise<LlmDiscoveredModel[]>
providerRetryPolicy(provider: string): ResolvedRetryPolicy
imageRequestPricing(provider: string, model: string): LlmImageRequestPricing | undefined
imageRequestTarget(provider: string, model: string, image: ImageAttachmentRef): ImageRequestTarget
fileRequestText(ref: FileAttachmentRef): string
async listModels(provider: string): Promise<LlmModelInfo[]>
async resolveModelInfo( provider: string, model: string, signal?: AbortSignal, ): Promise<LlmResolvedModelInfo>
async resolveCallConfig(config: LlmCallConfig, signal?: AbortSignal): Promise<LlmCallConfig>
async prepareCall( config: LlmCallConfig, signal?: AbortSignal, configure?: ConfigureCall, ): Promise<PreparedLlmCall>
stream(options: GenerateOptions): AsyncIterable<StreamChunk>
```

</details>

### lsp

The LSP capability seam (`ctx.lsp`).

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
registerProvider(provider: LspProvider): () => void
query(request: LspQueryRequest, signal?: AbortSignal): Promise<LspQueryResult>
```

</details>

### mcpResources

Scoped resource access plus three tools shared by configured MCP servers.

**首次出现**：0.1.6-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
register(server: string, provider: McpResourceProvider): () => void
```

</details>

### messageFeedback

Session-log service; cold operations never construct a Session or Agent.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote('list') list(request: MessageFeedbackListRequest): Promise<MessageFeedbackListResult>
@Remote('put') put(request: MessageFeedbackPutRequest): Promise<MessageFeedbackPutResult>
@Remote('delete') delete(request: MessageFeedbackDeleteRequest): Promise<MessageFeedbackDeleteResult>
```

</details>

### officeToPdf

A provider lifetime owns all converters, queued calls, and temporary files.

**首次出现**：0.1.6-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
readonly generation: OfficeToPdfGeneration = OfficeToPdfGeneration(randomUUID())
convert(request: OfficeToPdfRequest, signal?: AbortSignal): Promise<OfficeToPdfResult>
@Remote async render( workspaceFileScope: WorkspaceFileScope, path: string, priority: OfficeToPdfPriority, signal: AbortSignal, ): Promise<RenderedDocumentBytes>
@Remote('generation') getGeneration(signal: AbortSignal): OfficeToPdfGeneration
```

</details>

### otel

Shared transport provider.

**首次出现**：0.2.0-rc.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
createEventReporter(options: EventLogOptions): EventLogReporter
createSessionLogReporter(options: SessionLogOptions): SessionLogReporter
```

</details>

### permissionPresets

Owns the deployment's configured permission presets, the fixed Auto integration hook, and their write path.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote('catalog') catalog(): PermissionCatalog
registerAuto(admit: () => void): () => Promise<void>
current(session: Session): string
resolve(name: string): PresetSpec
optionOf(name: string): PresetOption
set(session: Session, name: string): void
```

</details>

### planMode

`ctx.planMode`: owns logged plan state, applies and narrates selected state at step start, the `plan:policy` section, the `/plan` command, and the stable exit tool.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
get(agent: Agent): { active: boolean; pending?: boolean }
set(agent: Agent, active: boolean): 'committed' | 'queued' | 'cancelled' | 'noop'
```

</details>

### pluginManager

Manage profile files and apply their declared reload lifecycle.

**首次出现**：0.1.6-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote listVersionExemptions(): { exemptions: Record<string, string[]>; warnings: string[] }
@Remote setVersionExemption(packageVersion: string, runtimeVersion: string, enabled: boolean, acceptRisk?: boolean): Promise<ChangeResult>
@Remote async listPlugins(): Promise<PluginInfo[]>
@Remote listBundles(): Promise<BundleInfo[]>
@Remote async registries(): Promise<PluginRegistries>
@Remote async inspect(spec: string, options?: InspectOptions, signal?: AbortSignal): Promise<PluginSpecInspection>
@Remote setPluginEnabled(id: PluginEntryId, enabled: boolean): Promise<ChangeResult>
@Remote setBundleEnabled(name: string, enabled: boolean): Promise<ChangeResult>
@Remote installBundle(spec: string, options?: InstallBundleOptions): Promise<ChangeResult>
@Remote async waitForInstall(requestId: PluginInstallRequestId): Promise<ChangeResult | null>
@Remote async cancelInstall(requestId: PluginInstallRequestId): Promise<PluginInstallCancellation>
@Remote removeBundle(name: string): Promise<ChangeResult>
```

</details>

### pluginMarket

Fetches, validates, and caches configured market indexes; annotates entries with the profile's installation facts.

**首次出现**：0.2.1-alpha.4

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote listIndexes(): MarketIndexSummary[]
@Remote async setIndexes(urls: string[]): Promise<void>
@Remote async search(url: string, query: MarketQuery): Promise<MarketSearchResult>
async entry(url: string, name: string): Promise<MarketListingEntry | undefined>
```

</details>

### pluginRegistryProbe

Compares public registry responses on the Host; the Client owns the initial selection.

**首次出现**：0.1.7-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote async fastest(): Promise<string | null>
```

</details>

### productAnalytics

Authenticated event intake; disabled instances do not inspect identity or accept new events.

**首次出现**：0.2.0-rc.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote enabled(): boolean
@Remote({ mode: 'stream' }) async *watchPolicy(signal: AbortSignal): AsyncIterable<boolean>
@Remote async report(event: ProductEvent): Promise<void>
```

</details>

### productTelemetry

Host analytics sender.

**首次出现**：0.1.7-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
emit(record: ProductTelemetryRecord): void
```

</details>

### profileContext

Current profile facts; scheduling and mutation belong to their callers.

**首次出现**：0.1.6-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
readonly packageManager?: ProfilePnpmInvocation
readonly startedBundles: readonly string[]
readonly overlays: readonly PatchOptions[]
readonly telemetryDisabledEnv: string | undefined
```

</details>

### ptcRuntime

Registers one `ctx.ptcRuntime` implementation.

**首次出现**：0.1.6-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract readonly language: string
abstract readonly isolation: string
release(owner: object): Promise<void>
abstract resolve(request: PtcRunRequest): PtcRunSpec
abstract run(spec: PtcRunSpec): Promise<PtcRunResult>
```

</details>

### remoteAccess

Registry of access policies, the Gateway's access decisions, list filtering, and the per-Peer access snapshot.

**首次出现**：0.2.1-alpha.3

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
registerPolicy<K extends Exclude<keyof PrincipalMap, 'owner'>>(kind: K, policy: RemoteAccessPolicy<PrincipalMap[K]>): () => void
invalidate(principal?: Principal): void
decide(request: RemoteAccessRequest<Principal>): RemoteAccessDecision
allows(resource: RemoteAccessResource): boolean
snapshotFor(principal: Principal): RemoteAccessBaseline
@Remote({ mode: 'stream' }) async *follow(signal: AbortSignal): AsyncIterable<RemoteAccessFrame>
```

</details>

### sandbox

Abstract process-sandbox service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract confine(argv: readonly string[], policy: SandboxPolicy, signal?: AbortSignal): Promise<ConfinedArgv>
```

</details>

### sandboxPolicy

The sandbox-policy service (`ctx.sandboxPolicy`).

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
readonly defaultMode: SandboxMode
readonly workspaceRoot: string
resolve(request: SandboxPolicyRequest = {}): SandboxExecutionPolicy
overrideOf(session: Session): SandboxMode | undefined
```

</details>

### schedule

Shared management service; reads, deletion, and timing edits never activate a Session.

**首次出现**：0.1.7-rc.2

**在线 Demo**：Settings 页 / 原生右侧栏 tab 的实时快照

<details><summary>方法签名</summary>

```ts
async create(sessionId: SessionId, request: ScheduleCreateRequest, signal?: AbortSignal): Promise<ScheduleRecord>
@Remote('list') async list(request: ScheduleListRequest): Promise<ScheduleRecord[]>
@Remote('catalog') async catalog(): Promise<ScheduleCatalogEntry[]>
@Remote('history') async history(request: ScheduleDeliveryHistoryRequest): Promise<ScheduleDeliveryHistoryResult>
@Remote('delete') async delete(request: ScheduleDeleteRequest, signal?: AbortSignal): Promise<ScheduleDeleteResult>
@Remote('update') async update(request: ScheduleUpdateRequest, signal?: AbortSignal): Promise<ScheduleUpdateResult>
```

</details>

```js
const service = ctx.get('schedule');
if (service !== undefined) {
  // async create(sessionId: SessionId, request: ScheduleCreateRequest, signal?: AbortSignal): Promise<ScheduleRecord>
}
```

### sessionController

Host service backing the generated `ctx.remote.session` namespace.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
resolveAgent(sessionId: SessionId): Promise<ApiSessionAgentResult>
inspect( sessionId: SessionId, signal?: AbortSignal, ): Promise<SessionInspection>
@Remote('list') async list(_request: SessionListRequest, signal: AbortSignal): Promise<SessionListValue>
@Remote('search') async search(request: SessionSearchRequest, signal: AbortSignal): Promise<SessionSearchValue>
@Remote('create') create(request: SessionCreateRequest): Promise<SessionCreateValue>
@Remote('selectModel') selectModel(request: SessionSelectModelRequest): Promise<SessionSelectModelValue>
@Remote async initializeDefaultModel(): Promise<void>
@Remote('modelCatalog') modelCatalog(): Promise<ModelCatalog>
@Remote canOpenWorkspacePath(): boolean
workspaceDesktop(): { name: string; available: boolean; fileManager: 'finder' | 'explorer' | 'directory' | null }
@Remote('openWorkspacePath') async openWorkspacePath( request: SessionOpenWorkspacePathRequest, signal: AbortSignal, ): Promise<SessionOpenWorkspacePathValue>
@Remote('workspacePathApplications') async workspacePathApplications( request: { readonly path: string }, signal: AbortSignal, ): Promise<readonly SessionWorkspacePathApplication[]>
@Remote('rename') rename(request: SessionRenameRequest): Promise<SessionRenameValue>
@Remote('fork') async fork(request: SessionForkRequest): Promise<SessionForkValue>
@Remote('prompt') async prompt(request: SessionPromptRequest, signal: AbortSignal): Promise<SessionPromptValue>
@Remote('attachment') attachment(request: SessionAttachmentRequest): Promise<SessionAttachmentValue>
@Remote('updateQueue') updateQueue(request: SessionUpdateQueueRequest): Promise<SessionUpdateQueueValue>
@Remote('cancel') cancel(request: SessionCancelRequest): SessionCancelValue
@Remote({ name: 'page', resources: { session: addressedSession } }) page(request: SessionPageRequest, signal: AbortSignal): Promise<SessionPage>
@Remote({ mode: 'stream', resources: { session: addressedSession } }) follow(request: SessionFollowRequest, signal: AbortSignal): AsyncIterable<SessionFollowFrame>
@Remote('projections') async projections(request: SessionProjectionsRequest, signal: AbortSignal): Promise<SessionProjectionsValue>
@Remote({ mode: 'stream' }) async *control(signal: AbortSignal): AsyncIterable<SessionControlFrame>
```

</details>

### sessionFeedback

Host Remote through which a product surface records a Session-level remark.

**首次出现**：0.1.5-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote('record') record(request: SessionFeedbackRecordRequest): Promise<SessionFeedbackRecordResult>
```

</details>

### sessionFileReferences

Host Remote adapter over the composed file-reference provider.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote list( agent: Agent, query: string, signal: AbortSignal, ): Promise<FileReferenceCandidate[]>
```

</details>

### sessionPersistence

Durable append-only session storage addressed through per-session handles.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
readonly identity: symbol = Symbol('sessionPersistence')
abstract create(header: SessionHeader, options?: SessionPersistenceCreateOptions): Promise<SessionHandle>
abstract open(id: SessionId, access: SessionAccess, options?: SessionPersistenceOpenOptions): Promise<SessionHandle>
abstract flush(): Promise<void>
abstract stat(id: SessionId, options?: SessionPersistenceStatOptions): Promise<SessionPersistenceSnapshot | undefined>
abstract list(options?: SessionPersistenceListOptions): Promise<readonly SessionPersistenceSnapshot[]>
```

</details>

### sessionProjectionCache

The persisted projection cache service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
cachedSnapshot( meta: SessionHeader, keys?: readonly Extract<keyof SessionProjectionMap, string>[], ): ProjectionSnapshot | undefined
cachedPredecessorTitle(meta: SessionHeader): ProjectionSnapshot | undefined
hydratePrepared( session: Session, events: readonly SessionEvent[], ): ProjectionSnapshot
async write(session: Session): Promise<void>
coldSnapshot( meta: SessionHeader, inheritedEventCount: SessionLogOffset, events: readonly SessionEvent[], ): ProjectionSnapshot
```

</details>

### sessionProjections

`ctx.sessionProjections`: the projection unit table and its drive.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
register< K extends keyof SessionProjectionMap, S extends SessionProjectionStateMap[K], >( definition: Omit<ProjectionDefinition<K, S>, 'wire'> & { wire: NonNullable<ProjectionDefinition<K, S>['wire']> }, ): () => void
register< K extends Exclude<keyof SessionProjectionStateMap, keyof SessionProjectionMap>, S extends SessionProjectionStateMap[K], >( definition: Omit<ProjectionDefinition<K, S>, 'wire'>, ): () => void
onChanged(listener: ProjectionChangeListener): () => void
stateOf<K extends keyof SessionProjectionStateMap>( session: Session, key: K, ): SessionProjectionStateMap[K] | undefined
snapshot( session: Session, keys?: readonly Extract<keyof SessionProjectionMap, string>[], ): ProjectionSnapshot
cachedSnapshot( session: Session, keys?: readonly Extract<keyof SessionProjectionMap, string>[], ): ProjectionSnapshot | undefined
checkpoint(session: Session): ProjectionCheckpoint
restoreFloor(checkpoint: ProjectionCheckpoint): SessionLogOffset | undefined
viewCheckpoint( checkpoint: ProjectionCheckpoint, keys?: readonly Extract<keyof SessionProjectionMap, string>[], ): Partial<SessionProjectionMap>
restore( checkpoint: ProjectionCheckpoint, events: readonly SessionEvent[], baseSeq: SessionLogOffset, header: SessionHeader, inheritedEventCount: SessionLogOffset, ): { snapshot: ProjectionSnapshot; checkpoint: ProjectionCheckpoint }
hydrate( session: Session, checkpoint: ProjectionCheckpoint, events: readonly SessionEvent[], baseSeq: SessionLogOffset, ): ProjectionSnapshot
```

</details>

### sessionQuery

Unified live-preferred session query service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
observeSession( sessionId: SessionId, options: SessionObservationOptions = {}, ): Promise<SessionObservation>
abstract searchSessions( request: SessionSearchRequest, exec?: SessionSearchExecContext, ): Promise<SessionSearchPage<SessionSearchHit>>
abstract searchEvents( request: SessionEventSearchRequest, exec?: SessionSearchExecContext, ): Promise<SessionEventSearchPage>
listSessions(signal?: AbortSignal): Promise<SessionRecord[]>
async readSession(sessionId: SessionId): Promise<SessionLogSnapshot>
async filterSessions( filters: readonly SessionResultFilter[], signal?: AbortSignal, ): Promise<SessionRecord[]>
async readTitle( sessionId: SessionId, signal?: AbortSignal, ): Promise<SessionTitleSnapshot | undefined>
async readTitleSnapshot( sessionId: SessionId, signal?: AbortSignal, ): Promise<SessionTitleObservation>
async readTitleSnapshots( sessionIds: readonly SessionId[], signal?: AbortSignal, ): Promise<SessionTitleObservationResult[]>
async listEvents(sessionId: SessionId): Promise<SessionEventRecord[]>
async filterEvents( sessionId: SessionId, filters: readonly SessionEventResultFilter[], ): Promise<SessionEventSearchDocument[]>
async readSurface(sessionId: SessionId): Promise<SessionSurfaceSnapshot>
async traceSession(sessionId: SessionId, signal?: AbortSignal): Promise<SessionLineageTrace>
async traceEvent(request: SessionEventTraceRequest, signal?: AbortSignal): Promise<SessionEventTraceObservation>
async readEvent(request: SessionEventReadRequest, signal?: AbortSignal): Promise<SessionEventWindow>
```

</details>

### sessionReferenceResolver

Exact-read consumer that prepares immutable cross-session message context.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
async listCandidates( agent: Agent, query: string = '', limit: number = this.config.candidateLimit, signal?: AbortSignal, ): Promise<SessionReferenceCandidate[]>
@Remote('candidates') async remoteExportCandidates( agent: Agent, query: string, signal: AbortSignal, ): Promise<SessionReferenceMentionCandidate[]>
async prepare( agent: Agent, content: ContentBlock[], references: SessionReferenceInput[], signal?: AbortSignal, ): Promise<PreparedReferencedMessage>
```

</details>

### sessions

In-memory session store (`ctx.sessions`).

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：Settings 页 / 原生右侧栏 tab 的实时快照

<details><summary>方法签名</summary>

```ts
registerMessageProjection(projection: SessionMessageProjection): () => Promise<void>
create(id?: SessionId, options?: CreateSessionOptions): Session
prepare(id?: SessionId, options?: PrepareSessionOptions): Session
enter(session: Session): () => void
announce(session: Session): void
async flush(session: Session): Promise<boolean>
get(id: SessionId): Session | undefined
list(): Session[]
fork(source: SessionForkSource, boundary?: SessionSeq, childSessionId?: SessionId): Session
```

</details>

```js
const service = ctx.get('sessions');
if (service !== undefined) {
  // registerMessageProjection(projection: SessionMessageProjection): () => Promise<void>
}
```

### sessionSkillCatalog

Host service backing `ctx.remote.skills` without activating a cold Agent.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote async list(request: SkillListRequest, signal: AbortSignal): Promise<SkillListValue>
```

</details>

### sessionTelemetry

Loadable form of the backend contract: one implementation per context — the cordis `Service` registration under the `telemetry` key throws on a duplicate, cordis' standard behavior.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract readonly sharing: SessionTelemetrySharingStatus
abstract emit(record: SessionTelemetryRecord): void
flush?(): void
abstract shutdown(): Promise<void>
```

</details>

### sessionTitle

Log-backed title fold plus asynchronous fallback generation.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
get(session: Session): SessionTitleSnapshot | undefined
rename(session: Session, title: string): SessionTitleSnapshot
async refresh(session: Session, signal?: AbortSignal): Promise<SessionTitleSnapshot | undefined>
register(provider: SessionTitleProvider): () => Promise<void>
```

</details>

### settings

Project Config schemas into forms and own optional instance-level UI policy.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
configure(presentation: { auto?: boolean }, owner: Fiber = this.ctx.fiber): () => void
prepareDocument(): Promise<string>
describe(options?: SettingsDescribeOptions): SettingsDescriptor[]
async update(ns: string, patch: object, expectedRevision?: number): Promise<void>
async replace(ns: string, section: object, expectedRevision?: number): Promise<void>
async mutate(ns: string, ops: readonly SettingsPathOp[], expectedRevision?: number): Promise<void>
```

</details>

### settingsController

Host service backing the generated `ctx.remote.settings` namespace.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote describe(): SettingsDescribeValue
@Remote update( ns: string, patch: Record<string, JsonValue>, expectedRevision: number | undefined, ): Promise<SettingsNamespaceView>
@Remote replace( ns: string, section: Record<string, JsonValue>, expectedRevision: number | undefined, ): Promise<SettingsNamespaceView>
@Remote async mutate( ns: string, ops: SettingsPathOpView[], expectedRevision: number | undefined, ): Promise<SettingsNamespaceView>
@Remote async openSettingsDocument(signal: AbortSignal): Promise<SettingsDocumentOpenValue>
```

</details>

### shell

Abstract bash execution service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract resolve(request: ShellExecRequest): ShellExecSpec
abstract execute(spec: ShellExecSpec): Promise<ShellExecution>
```

</details>

### shellEnv

Registry (`ctx.shellEnv`) for trusted, per-execution `DSH_*` variables.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
register(contributor: BashEnvContributor): () => void
collect(execution: ToolExecution): DshEnvironment
list(): BashEnvVariableInfo[]
```

</details>

### skills

Layered registry of skill providers, the host+per-scope shape the tools registry established.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
registerProvider(create: (control: SkillProviderControl) => SkillProvider): () => void
register(skill: SkillRegistration): () => void
async list(options: SkillViewOptions = {}): Promise<SkillSummary[]>
async snapshot(options: SkillViewOptions = {}): Promise<SkillCatalogSnapshot>
async get(name: string, options: SkillViewOptions = {}): Promise<SkillDefinition | undefined>
```

</details>

### speechController

Speech calls never activate or submit to an Agent.

**首次出现**：0.1.7-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote catalog(): SpeechCatalog
@Remote({ mode: 'stream' }) async *follow(signal: AbortSignal): AsyncIterable<SpeechCatalog>
@Remote configure(patch: SpeechSelectionPatch): Promise<void>
@Remote prepare(providerId: SpeechProviderId, options?: SpeechPreparationOptions): void
@Remote cancelPreparation(providerId: SpeechProviderId): Promise<void>
@Remote async transcribe(request: TranscriptionRequest, signal: AbortSignal): Promise<Transcript>
```

</details>

### speechToText

Registry shared by all transcription consumers in one Host composition.

**首次出现**：0.1.7-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
register(provider: SpeechProvider): () => Promise<void>
listProviders(): readonly SpeechProviderInfo[]
async *follow(caller: AbortSignal): AsyncIterable<SpeechSnapshot>
snapshot(): SpeechSnapshot
async configure(patch: SpeechSelectionPatch): Promise<void>
prepare(id: SpeechProviderId, options?: SpeechPreparationOptions): void
async cancelPreparation(id: SpeechProviderId): Promise<void>
resolve(request: SpeechRequest): SpeechSpec
async transcribe(spec: SpeechSpec, signal: AbortSignal): Promise<Transcript>
```

</details>

### spillStore

Abstract spill storage service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract saveText(input: SaveTextSpill): Promise<SpillRef>
```

</details>

### ssh

One non-reconnecting SSH session; loss invalidates all active operations.

**首次出现**：0.1.6-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
readonly ready: Promise<Hello>
async request<T>(method: string, params: unknown, result: z.ZodType<T>, signal?: AbortSignal, wait: boolean = false): Promise<T>
async connectStream(endpoint: SshStreamEndpoint, signal?: AbortSignal): Promise<Socket>
dispose(): Promise<void>
```

</details>

### storage

The storage hub service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
readonly backend: BackendRegistry = new BackendRegistry()
mount<K extends keyof StorageForms>(form: K, facility: StorageForms[K]): () => void
form<K extends keyof StorageForms>(form: K): StorageForms[K]
```

</details>

### storageDomain

The mounted domain facility.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
async open<S extends DomainSpec>(spec: S): Promise<Domain<S>>
get(name: string): DomainImpl | undefined
async closeAll(): Promise<void>
```

</details>

### subagentModelSelection

Singleton settings owner read when delegation tools are composed for a Session.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
current(): SubagentModelSelectionSettings
```

</details>

### subagents

Named provider registry with managed activations, durable discovery, and local child messaging.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
resolveMaxDepth(configured?: number | 'provider-managed'): number | undefined
startActivation(spec: SubagentActivationSpec & { readonly childId: SessionId }): Promise<SubagentActivation & { readonly messageId: MessageId }>
startActivation(spec: SubagentActivationSpec): Promise<SubagentActivation>
async waitForChildren(parent: Agent): Promise<boolean>
async sendMessage( sender: Agent, targetId: SessionId, content: ContentBlock[], options: SubagentSendMessageOptions, ): Promise<MessageId>
interrupt(targetSessionId: SessionId, authority: SubagentInterruptAuthority): void
async drainDescendants(parents: readonly Agent[]): Promise<void>
async drainChildren(parent: Agent, childIds: readonly SessionId[]): Promise<void>
listChildren(parentSessionId: SessionId, signal?: AbortSignal): Promise<SubagentCatalogEntry[]>
listDescendants(rootSessionId: SessionId, signal?: AbortSignal): Promise<SubagentDescendantListEntry[]>
@Remote('prompt') async prompt(request: SubagentPromptRequest, signal: AbortSignal): Promise<SubagentPromptReceipt>
@Remote('interruptByParent') interruptByParent( childSessionId: SessionId, parentSessionId: SessionId, mode: 'continuable', ): SubagentInterruptReceipt
registerProvider(provider: SubagentProvider): () => void
getProvider(name: string): SubagentProvider | undefined
list(): string[]
```

</details>

### subprocess

Abstract subprocess service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract resolveExecutable( command: string, env?: Readonly<Record<string, string>>, signal?: AbortSignal, ): Promise<string>
abstract terminalEnvironment(signal?: AbortSignal): Promise<SubprocessTerminalEnvironment>
abstract spawn(spec: SubprocessSpawnSpec): SubprocessHandle
abstract spawnTerminal(spec: SubprocessTerminalSpawnSpec): Promise<SubprocessTerminalHandle>
```

</details>

### systemPrompt

Registry service for the prompt inputs assembled before each model step.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
section(section: PromptSection): () => void
getSectionOrder(name: PromptSectionOrderName): number
getContextOrder(name: PromptContextOrderName): number
context(context: PromptContext): () => void
suppressRuntimeContext(): () => void
tools(provider: (context: AssembleContext) => ToolProviderResult): () => void
variable(name: string, provider: (context: AssembleContext) => string | undefined): () => void
refreshContext(assembly: PromptAssembly, context: AssembleContext = {}): PromptAssembly
async assemble(context: AssembleContext = {}): Promise<PromptAssembly>
```

</details>

### terminalController

Typed Remote control of transient Session-owned terminal processes.

**首次出现**：0.1.6-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote environment(agent: Agent, signal: AbortSignal): TerminalEnvironment
@Remote shells(agent: Agent, signal: AbortSignal): Promise<TerminalShell[]>
@Remote list(sessionId: SessionId): WebTerminalInfo[]
@Remote async create(agent: Agent, request: TerminalCreateRequest, signal: AbortSignal): Promise<WebTerminalInfo>
@Remote({ mode: 'stream' }) retain(sessionId: SessionId, id: WebTerminalId, signal: AbortSignal): AsyncIterable<TerminalRetentionFrame>
@Remote({ mode: 'stream' }) attach(agent: Agent, id: WebTerminalId, signal: AbortSignal): RemoteStream<TerminalFrame, TerminalInput>
@Remote rename(agent: Agent, id: WebTerminalId, title: string): void
@Remote async close(agent: Agent, id: WebTerminalId): Promise<void>
```

</details>

### terminals

In-process registry for replaceable PTY backends and exact-Agent sessions.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
registerBackend(backend: TerminalBackend): () => void
listBackends(): string[]
async spawn(owner: Agent, request: TerminalSpawnRequest, signal?: AbortSignal): Promise<TerminalSpawnResult>
hasOwnerActivity(owner: Agent): boolean
startSend(owner: Agent, id: TerminalSessionId, request: TerminalSendRequest): TerminalSendOperation
read(owner: Agent, id: TerminalSessionId, request: TerminalReadRequest = {}): TerminalReadResult
signal(owner: Agent, id: TerminalSessionId, signal: TerminalSignal): Promise<TerminalSignalResult>
async kill(owner: Agent, id: TerminalSessionId, reason: string = 'model request'): Promise<boolean>
list(owner: Agent): TerminalSessionSnapshot[]
```

</details>

### timer

Disposable timer helpers mixed into Cordis contexts.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
timeout(callback: () => void, delay: number): () => void
timeout(delay: number): Promise<void>
interval(callback: () => void, delay: number): () => void
interval<R = any>(delay: number): AsyncIterableIterator<void, R, void>
throttle<F extends (...args: any[]) => void>(callback: F, delay: number, noTrailing?: boolean): F & { dispose: () => void }
debounce<F extends (...args: any[]) => void>(callback: F, delay: number): F & { dispose: () => void }
```

</details>

### tokenMeter

Replay owner for one service-wide estimator and isolated per-session folds.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
measure(session: Session, requestHeader?: EpochHeader): TokenMeasurement
estimateMessage(message: Message): number
```

</details>

### toolResultPruner

Deterministic head/middle/tail pruning for current tool-result surface nodes.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
readonly config: ResolvedConfig
measureContent(blocks: readonly ContentBlock[]): number
pruneContent(blocks: readonly ContentBlock[]): ContentBlock[] | null
pruneSession(session: Session): PruneResult
```

</details>

### tools

Tool registry and execution pipeline.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：Settings 页 / 原生右侧栏 tab 的实时快照

<details><summary>方法签名</summary>

```ts
presentAs(mode: ToolPresentationMode): () => void
register(definition: ToolDefinition): () => void
restrict(filter: ToolRestriction): () => void
guard(guard: ToolGuard): () => void
get(name: string, scope?: ScopeKey): ToolDefinition | undefined
schemas(scope?: ScopeKey): ToolSchema[]
executionMode(exec: ToolExecutionInput): ToolExecutionMode
async execute(exec: ToolExecutionInput): Promise<ToolExecutionResult>
```

</details>

```js
const service = ctx.get('tools');
if (service !== undefined) {
  // presentAs(mode: ToolPresentationMode): () => void
}
```

### translator

One Host service with explicit routing, cancellation and quiescent unload.

**首次出现**：0.2.1-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
async availableProviders(signal?: AbortSignal): Promise<readonly TranslationProvider[]>
resolve(request: TranslationRequest): TranslationSpec
async translate(spec: TranslationSpec, signal?: AbortSignal): Promise<string>
```

</details>

### typert

Registry of generated schemas, package reflection, invocations, and Remote dependency providers.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
register(contribution: TypertContribution): TypertDisposer
get(key: string): TypertSchemaRecord | undefined
resolve(key: string): TypertSchemaRecord
list(filter: TypertSchemaFilter = {}): TypertSchemaRecord[]
getPackage(packageName: string, face: TypertFace = 'host'): TypertPackageRecord | undefined
listPackages(filter: TypertPackageFilter = {}): TypertPackageRecord[]
toJSONSchema(key: string, params?: z.core.ToJSONSchemaParams): z.core.JSONSchema.BaseSchema
```

</details>

### typertGateway

Resolve strict generated definitions or conservative SRC markers against current Cordis Services and Typert providers.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
readonly wireStream: TypertGatewayWireStream = { open: (endpoint, payload, uplink, peer, signal) => this.openWireStream(endpoint, payload, uplink, peer, signal, new AbortController()), failure: error => rpcError(error), }
hasLiveClient(): boolean
registerRemoteEvents( source: TypertRemoteEventSource, host: RemoteEventHostInfo, ): () => Promise<void>
async invoke(request: InvokeRemoteRequest): Promise<unknown>
async stream(request: InvokeRemoteRequest): Promise<AsyncIterable<unknown>>
```

</details>

### userQuestions

`ctx.userQuestions`: validation plus the scoped answerer waterfall.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote answer(agent: Agent, callId: ToolCallId, answer: AskUserQuestionAnswer): boolean
@Remote({ mode: 'stream' }) async *attachWait(agent: Agent, callId: ToolCallId, signal: AbortSignal): AsyncIterable<{ remainingMs: number }>
async askTimed( request: AskUserQuestionRequest & { agent: Agent }, callId: ToolCallId, timeoutMs: number, ): Promise<TimedUserQuestionResult>
async ask(request: AskUserQuestionRequest): Promise<AskUserQuestionAnswer>
```

</details>

### web

The web access service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
registerSearchProvider(provider: WebSearchProvider): () => void
registerFetchProvider(provider: WebFetchProvider): () => void
async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>
async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult>
```

</details>

### webApp

The Web GUI this process serves, provided by the `web-runtime` row.

**首次出现**：0.2.1-alpha.3

**在线 Demo**：Settings 页 / 原生右侧栏 tab 的实时快照

<details><summary>方法签名</summary>

```ts
getAdvertisedUrl(): string
```

</details>

```js
const service = ctx.get('webApp');
if (service !== undefined) {
  // getAdvertisedUrl(): string
}
```

### webhookRuntime

Fire-and-forget rule runtime.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
register<K extends string>(rule: WebhookRule<K>): () => Promise<void>
dispatch<K extends string>(delivery: VerifiedWebhookDelivery<K>): void
```

</details>

### webServer

The browser HTTP carrier service.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：Host 快照路由（/plugin-api-gallery/state）

<details><summary>方法签名</summary>

```ts
getOrigin(): string
register(route: WebRoute): () => void
registerUpgrade(route: WebUpgradeRoute): () => void
registerFallback(handler: WebRoute['handler']): () => void
tapIndex(transform: (html: string) => string): () => void
applyIndexTaps(html: string): string
collectIndexInjections(): IndexInjection[]
renderIndex(html: string): string
```

</details>

```js
const service = ctx.get('webServer');
if (service !== undefined) {
  // getOrigin(): string
}
```

### workflowEngine

Workflow Service Definition contract.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
abstract start(request: WorkflowStartRequest): WorkflowRun
```

</details>

### workingDirectory

One owner for each Session's effective directory and its model-visible changes.

**首次出现**：0.2.1-alpha.2

**在线 Demo**：Settings 页 / 原生右侧栏 tab 的实时快照

<details><summary>方法签名</summary>

```ts
readonly defaultDirectory: string
get(session: Session): string
ensure(agent: Agent, signal?: AbortSignal): Promise<string>
set(agent: Agent, path: string, signal?: AbortSignal): Promise<string>
```

</details>

```js
const service = ctx.get('workingDirectory');
if (service !== undefined) {
  // readonly defaultDirectory: string
}
```

### workspaceChanges

Serves the summaries and file comparisons the recorder keeps for live Sessions.

**首次出现**：0.1.6-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
summary(sessionId: SessionId, seq: number): WorkspaceChangesSummary | undefined
diff(sessionId: SessionId, seq: number, index: number, signal: AbortSignal): Promise<WorkspaceFileDiff | undefined>
```

</details>

### workspaceController

Host service backing the generated `ctx.remote.workspace` namespace.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote('create') create(request: WorkspaceCreateRequest): Promise<WorkspaceCreateValue>
@Remote('initializeDefault') async initializeDefault(signal: AbortSignal): Promise<WorkspaceValue | undefined>
@Remote('rename') rename(request: WorkspaceRenameRequest): Promise<WorkspaceValue>
@Remote('delete') delete(request: WorkspaceDeleteRequest): Promise<WorkspaceDeleteValue>
@Remote('insertBefore') insertBefore(request: WorkspaceInsertBeforeRequest): Promise<WorkspaceOrderValue>
@Remote('insertSessionBefore') insertSessionBefore(request: WorkspaceInsertSessionBeforeRequest): Promise<WorkspaceValue>
@Remote('archiveSession') archiveSession(request: WorkspaceArchiveSessionRequest): Promise<WorkspaceArchiveValue>
@Remote('unarchiveSession') unarchiveSession(request: WorkspaceUnarchiveSessionRequest): Promise<WorkspaceArchiveValue>
@Remote('pinSession') pinSession(request: WorkspacePinSessionRequest): Promise<WorkspacePinValue>
@Remote('unpinSession') unpinSession(request: WorkspaceUnpinSessionRequest): Promise<WorkspacePinValue>
@Remote({ mode: 'stream' }) async *follow(signal: AbortSignal): AsyncIterable<WorkspaceFollowFrame>
```

</details>

### workspaceFiles

Host Remote file reads and workspace directory observations over the composed filesystem.

**首次出现**：0.1.5-alpha.1

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
@Remote async read( workspaceFileScope: WorkspaceFileScope, path: string, range: WorkspaceFileRange, signal: AbortSignal, ): Promise<WorkspaceFileText>
@Remote async readBytes( workspaceFileScope: WorkspaceFileScope, path: string, options: WorkspaceByteReadOptions, signal: AbortSignal, ): Promise<WorkspaceFileBytes>
@Remote async stat(workspaceFileScope: WorkspaceFileScope, path: string, signal: AbortSignal): Promise<WorkspaceFileStat>
@Remote async list(workspaceFileScope: WorkspaceFileScope, path: string, signal: AbortSignal): Promise<WorkspaceDirectoryListing>
@Remote({ mode: 'stream' }) changes(workspaceFileScope: WorkspaceFileScope, path: string, signal: AbortSignal): AsyncIterable<WorkspaceFileWatchFrame>
```

</details>

### workspaceRegistry

Durable workspace registry.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
async create(path: string, title?: string): Promise<Workspace>
initializeDefault(resolveDirectory: () => Promise<string>): Promise<Workspace | undefined>
get(id: WorkspaceId): Workspace | undefined
list(): Workspace[]
delete(id: WorkspaceId): Promise<boolean>
insertBefore(id: WorkspaceId, beforeId?: WorkspaceId): Promise<readonly WorkspaceId[]>
archiveSession(sessionId: SessionId, options: ArchiveSessionOptions = {}): Promise<void>
unarchiveSession(sessionId: SessionId): Promise<void>
pinSession(sessionId: SessionId): Promise<void>
unpinSession(sessionId: SessionId): Promise<void>
async resolveByPath(path: string): Promise<Workspace | undefined>
```

</details>

### worktrees

Creates retained Git worktrees under the mounted filesystem and sandbox providers.

**首次出现**：0.2.1-alpha.2

**在线 Demo**：—（只读目录 + 用法片段）

<details><summary>方法签名</summary>

```ts
async create(agent: Agent, request: CreateWorktreeRequest = {}, signal?: AbortSignal): Promise<CreatedWorktree>
```

</details>

## Host Events

76 个。`waterfall` 必须返回 `next()`；`emit` 只观察；`serial`/parallel 按文档等待。

| 事件 | 版本 | 模式 | 说明 | 在线 Demo |
| --- | --- | --- | --- | --- |
| `agent-loop/config-start-failed` | ≤ 0.1.0-rc.7 | emit | A declarative agent entry failed before it could publish a live agent. | — |
| `agent-preset/selected` | ≤ 0.1.0-rc.7 | emit | One session committed a different agent preset to its durable log. | — |
| `agent/assistant-stream` | 0.1.3-alpha.1 | emit | Process-local assistant-stream publication. | — |
| `agent/created` | ≤ 0.1.0-rc.7 | serial | An entered agent is ready for per-agent initialization after factory setup. | — |
| `agent/disposed` | ≤ 0.1.0-rc.7 | emit | An agent left the registry; AgentLoop emits this after driver quiescence and scoped-registration unwind, but before session detachment. | — |
| `agent/error` | ≤ 0.1.0-rc.7 | emit | A step or turn errored. | — |
| `agent/inbox/claimed` | ≤ 0.1.0-rc.7 | emit | One message left the inbox inside its open turn. | — |
| `agent/inbox/discarded` | ≤ 0.1.0-rc.7 | emit | One message was discarded from the live inbox. | — |
| `agent/inbox/inserted` | ≤ 0.1.0-rc.7 | emit | One message entered the live inbox. | — |
| `agent/pre-step` | ≤ 0.1.0-rc.7 | waterfall | Reject a proposed step or replace the messages that enter it. | — |
| `agent/request` | ≤ 0.1.0-rc.7 | waterfall | Replace the frozen call configuration. | — |
| `agent/request-error` | ≤ 0.1.0-rc.7 | waterfall | Handle one failed model-request attempt before the loop retries or closes its step. | — |
| `agent/status` | ≤ 0.1.0-rc.7 | emit | Agent status changed (`idle` ⇄ `running`). | — |
| `agent/turn-stopping` | ≤ 0.1.0-rc.7 | serial | The turn is about to close: the model owes no response (no live tool calls, no fresh steering). | — |
| `api-session/activity` | 0.1.2-alpha.1 | emit | One user-authored durable message advanced Session list activity. | — |
| `api-session/added` | 0.1.2-alpha.1 | emit | A Session became visible or its Agent was created or disposed. | — |
| `api-session/error` | 0.1.2-alpha.1 | emit | One Agent failed outside a durable turn position. | — |
| `api-session/removed` | 0.1.2-alpha.1 | emit | A Session left the live Host registry. | — |
| `api-session/status` | 0.1.2-alpha.1 | emit | One Agent changed running state. | — |
| `app-boot/config-reload` | 0.1.7-alpha.1 | emit | Profile patches were reconciled into the running Loader tree: every entry update settled and no new inactive entry was introduced. | — |
| `approval/request` | ≤ 0.1.0-rc.7 | waterfall | Ask composed answerers for one decision. | — |
| `authorization/settled` | 0.1.1-rc.1 | emit | One authorization attempt has finished and released its key. | — |
| `commands/change` | ≤ 0.1.0-rc.7 | emit | A command was registered or unregistered. | — |
| `compaction/summary-error` | 0.1.6-alpha.1 | waterfall | Recover a failed summary request by synchronously recording a durable change to its selected input. | — |
| `connection/request` | 0.1.6-alpha.2 | waterfall | Admit or wrap an authenticated shared API request, including body transfer. | — |
| `credentials/record-updated` | 0.1.1-rc.1 | emit | Committed change to a stored credential record: a `modifyRecord` that wrote, a `deleteRecord` that removed, or an external edit observed in storage. | — |
| `credentials/reference-updated` | 0.1.1-rc.1 | emit | Committed change to a provider-managed credential source: a `set`, an `unset`, or an external edit observed in storage. | — |
| `deepseek-account/model-sign-in-required` | 0.1.7-rc.2 | emit | An account model request requires the user to sign in. | — |
| `deepseek-account/session-expired` | 0.1.7-rc.2 | emit | Server rejection removed the current account credential; this notification is not replayed. | — |
| `deepseek-account/signed-out` | 0.1.7-rc.2 | emit | Local grant removal has completed. | — |
| `domain/changed` | ≤ 0.1.0-rc.7 | emit | A domain record or the global singleton changed, emitted once per write strictly after the backend acknowledged durability. | — |
| `feedback/committed` | 0.1.3-alpha.2 | parallel | Observe a durable cold feedback mutation without publishing a live Session. | — |
| `fs/edit-intent` | ≤ 0.1.0-rc.7 | waterfall | Single-slot decision for the next FileSystem.editText. | — |
| `fs/observed` | ≤ 0.1.0-rc.7 | emit | Record an authoritative positive or negative observation. | — |
| `fs/write-intent` | ≤ 0.1.0-rc.7 | waterfall | Single-slot decision for the next FileSystem.writeText. | — |
| `goal/activation-changed` | 0.1.5-alpha.1 | emit | Process-local goal activation changed for one session. | — |
| `goal/changed` | ≤ 0.1.0-rc.7 | emit | Goal mutation accepted by one live agent. | — |
| `hmr/change` | 0.1.6-alpha.2 | emit | A watched file has no module or configuration handler. | — |
| `hmr/reload` | 0.1.6-alpha.2 | emit | Module replacements have finished loading. | — |
| `llm/adapters-updated` | ≤ 0.1.0-rc.7 | emit | The provider topology changed: an adapter registered or unregistered routes, or the configurable-provider directory gained or lost entries. | — |
| `llm/stream` | ≤ 0.1.0-rc.7 | waterfall | Waterfall around every streaming model call (retry, replay, routing). | — |
| `permission-presets/catalog-changed` | 0.1.6-alpha.1 | emit | The selectable process catalog changed. | — |
| `plugin-manager/changed` | 0.1.6-alpha.2 | emit | The profile's plugins, bundles, or composition changed: a manager operation completed. | — |
| `plugin-manager/install-log` | 0.1.6-alpha.2 | emit | One chunk of a pnpm run's output, streamed as the run produces it. | — |
| `plugin-manager/install-state` | 0.1.6-alpha.2 | emit | An installation moved between its Host phases. | — |
| `plugin-market/changed` | 0.2.1-alpha.4 | emit | The configured index sources changed. | — |
| `schedule/changed` | 0.1.7-rc.2 | emit | Durable task set changed; clients refetch global task and Session-active catalogs. | — |
| `session-telemetry/record` | ≤ 0.1.0-rc.7 | waterfall | Transform one outbound record before it reaches the backend. | — |
| `session/created` | ≤ 0.1.0-rc.7 | emit | Creation announcement during session publication. | — |
| `session/disposed` | ≤ 0.1.0-rc.7 | emit | Emitted once when an announced session leaves the store, including publication rollback, but never for an entry whose creation announcement did not begin. | — |
| `session/event` | ≤ 0.1.0-rc.7 | emit | Post-commit, fire-and-forget append feed. | — |
| `session/flush` | ≤ 0.1.0-rc.7 | parallel | Awaited parallel durability checkpoint: every listener runs and the caller awaits all of them, with no waterfall veto. | — |
| `settings/document-updated` | ≤ 0.1.0-rc.7 | emit | One profile entry's form values, availability, or page policy changed. | — |
| `skills/change` | ≤ 0.1.0-rc.7 | emit | A skill provider, runtime contribution, or provider-backed catalog may have changed. | — |
| `subagent/end` | ≤ 0.1.0-rc.7 | emit | A published child settled. | — |
| `subagent/provider-added` | ≤ 0.1.0-rc.7 | emit | A provider became resolvable in the registry. | — |
| `subagent/provider-removed` | ≤ 0.1.0-rc.7 | emit | A provider left the registry. | — |
| `subagent/start` | ≤ 0.1.0-rc.7 | emit | A provider established a published child. | — |
| `system-prompt/assemble` | ≤ 0.1.0-rc.7 | waterfall | Expert waterfall over the assembled sections, contexts, tools, and variables. | — |
| `system-prompt/change` | ≤ 0.1.0-rc.7 | emit | Emitted when any prompt provider changes. | — |
| `tools/change` | ≤ 0.1.0-rc.7 | emit | A tool was registered or unregistered, or a scoped restriction changed (the available tool set changed — possibly for one scope only). | — |
| `tools/execute` | ≤ 0.1.0-rc.7 | waterfall | Around-dispatch waterfall for timeout, retry, or metrics. | — |
| `tools/post-execute` | ≤ 0.1.0-rc.7 | waterfall | Accept, replace, enrich, or block a normalized dispatch result. | — |
| `tools/pre-execute` | ≤ 0.1.0-rc.7 | waterfall | Allow, deny, cancel, or ask before dispatch. | — |
| `tools/ptc-dispatch-log` | 0.1.2-alpha.1 | waterfall | Allow a listener to replace content in the DURABLE LOG COPY of one `run_code` sub-dispatch outcome before the bridge appends its `tool/ptc-dispatch` event. | — |
| `tools/result` | ≤ 0.1.0-rc.7 | emit | Observe the frozen, lossless-JSON final outcome. | — |
| `user-questions/request` | 0.1.2-alpha.1 | waterfall | Ask composed answerers for structured user input. | — |
| `webserver/index-inject` | 0.1.1-rc.1 | emit | Collect the structured index injection table. | — |
| `workflow/agent-end` | ≤ 0.1.0-rc.7 | emit | One `agent()` call settled (clean result, child failure, or run cancellation). | — |
| `workflow/agent-start` | ≤ 0.1.0-rc.7 | emit | One `agent()` call established a published child run. | — |
| `workflow/end` | ≤ 0.1.0-rc.7 | emit | A workflow run settled (any stop reason). | — |
| `workflow/log` | ≤ 0.1.0-rc.7 | emit | The script emitted a narration line (a `log(message)` call). | — |
| `workflow/phase` | ≤ 0.1.0-rc.7 | emit | The script entered a phase (a `phase(title)` call) — progress grouping for observers; no execution semantics. | — |
| `workflow/start` | ≤ 0.1.0-rc.7 | emit | A workflow run started — the script's meta block validated, the body about to execute. | — |
| `workspace/session-activity` | 0.1.7-alpha.1 | waterfall | Ask the composed providers what still runs for a session before it is archived. | — |
| `workspace/session-stop` | 0.1.7-alpha.1 | parallel | Stop a session's running work because the caller archived it with `stopActivity`; the archive set is durable when this dispatches. | — |

## Client Services

8 个。客户端服务通过受限 `ctx.get` 获取。

### layout

Panel navigation and geometry actions exposed through ctx.layout.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—

<details><summary>方法签名</summary>

```ts
selectPanel(panelId: MainPanelId | null): void
beginNavigation(): AbortSignal
toggleSidebar(): void
openRightbar(track: boolean, fullscreen: boolean): void
closeRightbar(): void
```

</details>

### locale

Dictionary registry plus locale preference.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—

<details><summary>方法签名</summary>

```ts
getLocale(): LocaleSnapshot
getSnapshot(): LocaleSnapshot
subscribe(fn: () => void): () => void
setLocale(id: string): void
addLanguage(input: LanguageRegistration): () => void
register<N extends Extract<keyof LocaleNamespaceMap, string>>(ns: N, dicts: Record<BuiltInLocaleId, LocaleDictOf<N>>): () => void
register(ns: string, locale: string, dict: LocaleDict): () => void
bind<N extends Extract<keyof LocaleNamespaceMap, string>>(ns: N): TranslateNS<N>
bind(ns: string): Translate
```

</details>

### sessions

The sessions-service face injected as `ctx.sessions`.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—

<details><summary>方法签名</summary>

```ts
retain(target: SessionTarget, options: SessionRetainOptions): SessionReference
using<T>(target: SessionTarget, options: SessionRetainOptions, operation: (reference: SessionReference) => T | Promise<T>): Promise<T>
retainInfo(id: SessionId): ObservableSnapshot<SessionRetainInfo>
refreshProjections(sessionId: SessionId): Promise<void>
search( query: string, signal: AbortSignal, ): Promise<RemoteResult<{ items: SessionSearchResultItem[]; hasMore: boolean }>>
fork(opts: { sessionId: SessionId atSeq?: number increaseTitle?: boolean onCreated?: (childId: SessionId) => void /** False refuses source migration; omission preserves the Host default. */ allowMigration?: boolean }): Promise<SessionId>
scope(id: SessionId): AgentContext | undefined
binding(id: SessionId): SessionBinding | undefined
```

</details>

### slots

cordis Service layer of the slot system; see the module doc for the split with SlotCore.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—

<details><summary>方法签名</summary>

```ts
declare readonly register: SlotCore['register']
declare readonly registerFactory: RegisterFactory
inject(key: keyof SlotMap & string, callback: () => SlotInjectionEffect): () => void
```

</details>

### theme

Theme registry and preference owner.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—

<details><summary>方法签名</summary>

```ts
getTheme(): ThemeSnapshot
setTheme(id: string): void
setFontSize(role: FontRole, px: number): void
register(definition: ThemeDefinition): () => void
overrideTokens(source: string, tokens: ThemeTokenOverrides): () => void
```

</details>

### timer

Disposable timer helpers mixed into Cordis contexts.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—

<details><summary>方法签名</summary>

```ts
timeout(callback: () => void, delay: number): () => void
timeout(delay: number): Promise<void>
interval(callback: () => void, delay: number): () => void
interval<R = any>(delay: number): AsyncIterableIterator<void, R, void>
throttle<F extends (...args: any[]) => void>(callback: F, delay: number, noTrailing?: boolean): F & { dispose: () => void }
debounce<F extends (...args: any[]) => void>(callback: F, delay: number): F & { dispose: () => void }
```

</details>

### uiWorkspace

Workspace archive and directory operations consumed by Client UI domains.

**首次出现**：0.1.2-alpha.1

**在线 Demo**：—

<details><summary>方法签名</summary>

```ts
openSession(target: SessionTarget): void
openWorkspace( workspaceId: WorkspaceId, beforeOpen?: (sessionId: SessionId) => void, options?: Pick<StartSessionOptions, 'agentPreset'>, ): Promise<void>
forkSession( sessionId: SessionId, onCreated?: (childId: SessionId) => void, options?: Pick<Parameters<ISessions['fork']>[0], 'allowMigration'>, ): Promise<SessionId>
connectWorkspace(workspaceId: WorkspaceId, options?: Pick<StartSessionOptions, 'agentPreset'>): Promise<SessionId>
startSession(workspaceId?: WorkspaceId, options?: StartSessionOptions): void
archiveSession(sessionId: SessionId, options?: { readonly stopActivity?: boolean }): Promise<void>
unarchiveSession(sessionId: SessionId): Promise<void>
pickDirectory(): Promise<string | null>
listDirectory(path?: string, signal?: AbortSignal): Promise<DirectoryListing>
createDirectory(path: string, name: string): Promise<string>
```

</details>

### workspaces

Workspace Controller's Client service face.

**首次出现**：≤ 0.1.0-rc.7

**在线 Demo**：—

<details><summary>方法签名</summary>

```ts
create(input: { path: string }): Promise<WorkspaceView>
rename(workspaceId: WorkspaceId, title: string): Promise<WorkspaceView>
delete(workspaceId: WorkspaceId): Promise<void>
archiveSession(sessionId: SessionId, options?: { readonly stopActivity?: boolean }): Promise<void>
unarchiveSession(sessionId: SessionId): Promise<void>
insertSessionBefore( workspaceId: WorkspaceId, sessionId: SessionId, beforeSessionId?: SessionId, ): Promise<WorkspaceView>
```

</details>

## Client Events

4 个。

| 事件 | 版本 | 模式 | 说明 | 在线 Demo |
| --- | --- | --- | --- | --- |
| `connection/reset` | ≤ 0.1.0-rc.7 | emit | A connection generation was established. | — |
| `locale/change` | ≤ 0.1.0-rc.7 | emit | The active locale switched. | — |
| `slots/changed` | ≤ 0.1.0-rc.7 | emit | An ordinary Slot declaration or entry registration set changed. | — |
| `theme/change` | ≤ 0.1.0-rc.7 | emit | Theme state changed (preference switched, registry updated, or the OS color scheme changed while the preference is `system`). | — |

## Client Builtins

动态 Client half 可直接使用的符号。持久化 bundle 只有 `React`（`require("react")`）与浏览器全局；`host`/`styles` 需要动态 cordis 包。

| 符号 | 说明 | 在线 Demo |
| --- | --- | --- |
| `ctx` | Restricted Cordis Context. Prefer ctx.get(name) with an undefined check; use inject only for hard dependencies. | slot 注册与 ctx.get |
| `React` | React runtime exposed without JSX transformation. | 所有 demo 组件 |
| `host` | Package-private JSON RPC from Client to this Package's Host half. | — |
| `styles` | Package-owned stylesheet insertion cleaned up with the Client run. | — |
| `console` | Package-tagged browser logging. | — |

## Slots

103 个 Slot、6 个 Factory。`replaceRisk: shadows-shipped-ui` 表示复用内置 id 会替换内置 UI；新 id 通常是增量注册。

| Slot | 版本 | 类型 | 作用域 | 父节点 | 用途 | 在线 Demo |
| --- | --- | --- | --- | --- | --- | --- |
| `root` | ≤ 0.1.0-rc.7 | single | root | — | The built-in render-tree root hole (seeded by SlotCore): the one slot the shell itself renders, and the ancestor of every other seat. | — |
| `shell.overlay` | ≤ 0.1.0-rc.7 | list | root | root | Frame-wide floating layer, above every column and outside their scroll containers. | 详情弹层 / Toast |
| `shell.quota-notice` | 0.1.7-rc.2 | chain | root | shell.overlay | Frame-wide quota notice chain. | — |
| `workspace.toast` | 0.2.1-alpha.3 | keyed | root | shell.overlay | Workspace notices selected by their existing business discriminator. | — |
| `main` | 0.1.5-alpha.2 | keyed | root | root | Central panel selected by sidebar entry id. | — |
| `plugins.item` | 0.1.6-alpha.2 | list | root | main | One official plugin the Plugins page lists in its Official group after the official bundles: `label` is the card's title and `order` its place. | — |
| `plugins.detail.actions` | 0.1.7-alpha.1 | list | root | main | Controls at the head of a detail page, before the page's own switch and uninstall, rendered with the page's subject. | — |
| `plugins.detail.badge` | 0.1.7-alpha.1 | list | root | main | Tags beside a detail page's title, after the version, beta, and problem tags the page draws itself, rendered with the page's subject. | — |
| `plugins.add.actions` | 0.2.1-alpha.1 | list | root | main | Additional MenuItemButton rows after installation: 72px high, with a title and a description capped at two lines. | — |
| `plugins.tab` | 0.2.1-alpha.4 | list | root | main | Tabs after the page's own Installed tab, such as Discover: `label` names the tab and `order` places it. | — |
| `plugins.detail.section` | 0.1.7-alpha.1 | list | root | main | Sections under a detail page's own content: after the rows on a bundle's page, after the configuration on a row's or an official plugin's page. | — |
| `plugins.bundle.activation` | 0.1.7-alpha.1 | keyed | root | main | Optional guidance after the user enables a bundle from the list, keyed by npm package name. | — |
| `plugins.bundle.config` | 0.1.6-alpha.2 | keyed | root | main | A bundle's own configuration, keyed by the bundle's package name and rendered on the bundle's page between its description and its rows (`view: 'page'` only). | — |
| `plugins.row.config` | 0.1.6-alpha.2 | keyed | root | main | The configuration of one row a bundle declares, keyed by `<package name>#<row id>` with the row id as the bundle's patch declares it: the row on the bundle's page gains a configure control that opens the entry's page, headed by the plugin's display title and description. | — |
| `main.conversation` | 0.1.5-alpha.2 | single | session-maybe | main | Conversation shell beneath its root-scoped main-panel entry. | — |
| `conversation.header` | 0.1.7-alpha.1 | single | session-maybe | main.conversation | Resident navigation container, including when no Session is selected. | — |
| `conversation.header.leading` | 0.1.7-alpha.1 | single | root | conversation.header | Global navigation before the Session title, available without a Session. | — |
| `conversation.session.header` | ≤ 0.1.0-rc.7 | single | session | conversation.header | Strict per-Session title, actions, and View navigation. | — |
| `conversation.session.header.utilities` | ≤ 0.1.0-rc.7 | list | session | conversation.session.header | Right-aligned Session utilities in ascending order. | 会话右上角按钮 |
| `conversation.session.header.actions` | ≤ 0.1.0-rc.7 | list | session | conversation.session.header | Title-adjacent Session actions in ascending order. | — |
| `conversation.session.header.corner` | 0.1.5-alpha.1 | single | session | conversation.session.header | The header's far-right corner, past the utilities' edge and into the header's own padding, for one control. | — |
| `conversation.session.header.lineage` | 0.1.1-rc.1 | single | session | conversation.session.header | Optional replacement for one Session breadcrumb title. | — |
| `conversation.session.header.views.actions` | 0.2.1-rc.3 | list | root | conversation.session.header | Rows of the View tab row's More menu; the header shows More only while this list has registrations. | 会话头部 View「更多」菜单行（0.2.1-rc.3） |
| `sidebar` | ≤ 0.1.0-rc.7 | single | root | root | The whole left column. | — |
| `sidebar.footer.action` | ≤ 0.1.0-rc.7 | list | root | sidebar | Optional actions beside Settings at the sidebar foot. | 侧栏底部动作 |
| `sidebar.panellist` | 0.1.5-alpha.2 | list | root | sidebar | Global panel icons. | — |
| `sidebar.brand.mark` | 0.1.0-rc.8 | single | root | sidebar | Brand mark rendered in the expanded brand row and collapsed rail. | — |
| `sidebar.toggle.badge` | 0.1.6-alpha.2 | single | root | sidebar | Non-interactive notification inside the collapsed sidebar expand button. | — |
| `sidebar.settings` | ≤ 0.1.0-rc.7 | single | root | sidebar | The settings seat at the sidebar foot. | — |
| `settings.section` | ≤ 0.1.0-rc.7 | list | root | sidebar.settings | One settings page per list entry. | Settings 整页 |
| `settings.general.item` | ≤ 0.1.0-rc.7 | list | root | settings.section | One preference row inside the General section — the additive seat for a single setting that needs no page of its own (a whole page is `settings.section`), contributed by the feature plugin that owns the preference (locale → Language, ui-theme → Appearance, ui-conversation → Composer Enter). | General 偏好行 |
| `settings.plugins.tab` | ≤ 0.1.0-rc.7 | list | root | settings.section | One page inside the Plugins settings section. | Plugins 设置 tab |
| `settings.models.footer` | 0.1.2-alpha.1 | list | root | settings.section | Ordered extension area after the provider rows and the add controls. | — |
| `settings.models.provider-card` | 0.1.2-alpha.1 | keyed | root | settings.section | One provider card's adapter extension area, dispatched with `entryKey = settingsNs` on every card that renders a directory row: a saved row's card (its first-run setup posture included) and the add-provider draft card. | — |
| `settings.action` | ≤ 0.1.0-rc.7 | list | root | sidebar.settings | Optional actions rendered in the content-column header before Close. | — |
| `settings.onboarding` | ≤ 0.1.0-rc.7 | list | root | sidebar.settings | Root-scoped onboarding steps contributed by settings features. | — |
| `settings.models.sign-in` | 0.1.7-alpha.1 | single | root | settings.onboarding | Optional account login choice before the credential editor. | — |
| `settings.trigger` | ≤ 0.1.0-rc.7 | single | root | sidebar.settings | The sidebar-foot trigger row content: icon + label, supplied as slot content (the accessible name comes from the content — rail state renders the label visually hidden). | — |
| `settings.header` | ≤ 0.1.0-rc.7 | single | root | sidebar.settings | The panel title text seat. | — |
| `settings.close` | ≤ 0.1.0-rc.7 | single | root | sidebar.settings | The close button's visually-hidden label text (the button itself — icon, geometry, focus — is shell chrome). | — |
| `settings.launcher` | 0.1.7-alpha.1 | single | root | sidebar.settings | Optional sidebar account launcher; opens the shell-owned settings panel. | — |
| `sidebar.workspaces` | ≤ 0.1.0-rc.7 | single | root | sidebar | The workspace/session browsing region: section header, search, the grouped/flat session list, and every workspace dialog. | — |
| `sidebar.session.row.leading` | 0.1.7-rc.2 | list | root | sidebar.workspaces | Leading decoration of one Session row, in the 16px cell before the title that the row's own state dot otherwise occupies. | Session 行前徽标 |
| `sidebar.workspaces.session.menu.item` | 0.1.7-alpha.1 | list | root | sidebar.workspaces | The rows of one Session's "..." menu, in ascending `order`. | — |
| `sidebar.workspaces.session.row.action` | 0.1.7-alpha.1 | list | root | sidebar.workspaces | The hover buttons at the end of one Session row, in ascending `order`, after the "..." menu trigger. | — |
| `sidebar.session.row.hover` | 0.1.7-rc.2 | list | root | sidebar.workspaces | Section of the Session row's hover card between its relative time and its trailing status line. | — |
| `sidebar.workspaces.directoryFlow` | ≤ 0.1.0-rc.7 | single | root | sidebar.workspaces | Directory-flow hole under the sidebar browsing region (declared by the WorkspaceBrowser entry). | — |
| `sidebar.brand.name` | 0.1.0-rc.8 | single | root | sidebar | Brand name rendered beside the expanded mark. | — |
| `sidebar.panellist.actions` | 0.2.1-rc.3 | list | root | sidebar | Rows of the panel list's More menu; the sidebar shows More only while this list has registrations. | 左侧栏「更多」菜单行（0.2.1-rc.3） |
| `rightbar` | 0.1.5-alpha.1 | single | root | root | The right column: a track the centre makes room for, or nothing. | — |
| `rightbar.session` | 0.1.5-alpha.2 | single | session | rightbar | Session content selected by the root-scoped right Sidebar controller. | — |
| `sidebar.right.tab.menu.item` | 0.1.5-alpha.1 | list | session | rightbar.session | Extra items at the end of one tab's actions menu, in registration order. | — |
| `sidebar.right.pane.tab` | 0.1.5-alpha.1 | keyed | session | rightbar.session | One tab's body, dispatched with the `id` of the type in force for `tab.kind`. | — |
| `sidebar.right.tab.files.actions` | 0.2.0-rc.2 | list | session | sidebar.right.pane.tab | Workspace directory actions after the file tree's reload control. | — |
| `sidebar.right.tab.document.actions` | 0.1.7-alpha.1 | list | session | sidebar.right.pane.tab | Header toolbar contributions acting on the previewed file, rendered after the preview's own controls once the file's Host path is known. | — |
| `sidebar.right.tab.document.unpreviewable` | 0.1.7-alpha.1 | list | session | sidebar.right.pane.tab | Empty-state contributions for a file this preview cannot render, offered where Retry would stand once the file's Host path is known. | — |
| `deliverables.review.file.actions` | 0.1.7-alpha.1 | list | session | sidebar.right.pane.tab | The same file actions owned by a changed-file review tab. | — |
| `sidebar.right.tab.guide.actions` | 0.2.1-rc.3 | list | root | sidebar.right.pane.tab | Rows of the guide's More menu; the guide shows More only while this list has registrations. | 右侧栏起始页「更多」菜单行（0.2.1-rc.3） |
| `sidebar.right.tab.guide.entry` | 0.1.6-alpha.1 | keyed | session | sidebar.right.pane.tab | One provider's guide card, with the standard card as the owner's fallback. | — |
| `sidebar.right.tab.guide` | 0.1.5-alpha.1 | chain | session | sidebar.right.pane.tab | The guide tab's body. | — |
| `sidebar.chat.conversation` | 0.1.6-alpha.2 | single | session | sidebar.right.pane.tab | Session-scoped Conversation occurrence hosted by one Sidebar chat tab. | — |
| `sidebar.right.tab.document` | 0.1.5-alpha.2 | keyed | session | sidebar.right.pane.tab | Document body selected by a registered implementation id. | — |
| `sidebar.right.tab.document.office.pdf` | 0.1.6-alpha.2 | keyed | session | sidebar.right.tab.document | PDF presentation supplied with Office-owned converted bytes. | — |
| `sidebar.right.tab.document.action` | 0.1.7-alpha.1 | keyed | session | sidebar.right.pane.tab | Renderer-specific controls before the document toolbar's reload button. | — |
| `sidebar.right.pane.tab.title` | 0.1.5-alpha.1 | keyed | session | rightbar.session | A tab's title as its chip (and a floating panel's header) shows it, dispatched with the same key and information hook as the body. | — |
| `shell.bottom` | 0.2.1-alpha.1 | single | root | root | Full-width bottom content below all three columns. | — |
| `shell.leading` | 0.1.7-alpha.1 | single | root | root | Window-chrome seat at the frame's top-left, over every main panel. | — |
| `conversation.user.text.node` | 0.2.1-alpha.3 | keyed | session | conversation.user.text | One business-owned inline renderer for a pure JSON text node. | — |
| `conversation.hero.options` | 0.2.1-alpha.3 | list | session | conversation.content | Compact options right-aligned in the New Session row after the workspace and preset controls; rendered only with a Session. | New Session Hero 选项 |
| `conversation.input.dock` | ≤ 0.1.0-rc.7 | list | session | conversation.content | Full-width entries above the composer card. | — |
| `conversation.composer` | ≤ 0.1.0-rc.7 | chain | session | conversation.content | Selector-routed replacements for the current Session's resident composer. | — |
| `conversation.plan-review.actions` | 0.1.6-alpha.2 | list | session | conversation.composer | Actions for the exact plan under review; approval remains with the question composer. | — |
| `conversation.approval.detail` | 0.1.2-alpha.1 | single | session | conversation.composer | Optional detail for the Tool call correlated with an approval request. | — |
| `conversation.hero.workspace` | ≤ 0.1.0-rc.7 | single | root | conversation.content | Workspace picker shown by the blank-session Hero. | — |
| `conversation.hero.workspace.directoryFlow` | ≤ 0.1.0-rc.7 | single | root | conversation.hero.workspace | Directory-flow hole under the conversation empty-state picker (declared by the WorkspacePicker entry). | — |
| `conversation.session` | ≤ 0.1.0-rc.7 | single | session | conversation.content | Strict per-Session Conversation body. | — |
| `conversation.view` | ≤ 0.1.0-rc.7 | list | session | conversation.session | Registered Conversation target Views, rendered one at a time. | 会话 View 标签栏 tab |
| `conversation.trajectory.images` | 0.1.2-alpha.1 | single | session | conversation.view | Renderer for one group of durable record images in the Trajectory ledger. | — |
| `conversation.chat.flow` | 0.2.1-alpha.2 | single | session | conversation.view | Ordered Chat rows and local echoes with viewport-bound visibility hooks. | — |
| `conversation.chat.node` | ≤ 0.1.0-rc.7 | keyed | session | conversation.chat.flow | Final Chat node renderer, keyed by `ChatNodeKind`. | — |
| `conversation.chat.assistant-actions` | ≤ 0.1.0-rc.7 | list | session | conversation.chat.node | Ordered actions for one finalized assistant message. | assistant 消息动作 |
| `conversation.chat.turnTail` | ≤ 0.1.0-rc.7 | list | session | conversation.chat.node | Ordered feature contributions before a completed Turn's action row. | Turn 结束行 |
| `deliverables.file.actions` | 0.1.7-alpha.1 | list | session | conversation.chat.turnTail | Open one file through its authorized Session event coordinates. | — |
| `tool.call.toolview` | ≤ 0.1.0-rc.7 | keyed | session | conversation.chat.node | Keyed Tool call view dispatched by wire Tool name. | — |
| `tool.call.images` | 0.1.3-alpha.1 | single | session | tool.call.toolview | Durable images of a settled image-bearing Tool call, rendered through the attachment presentation plugin. | — |
| `tool.view.cordis` | ≤ 0.1.0-rc.7 | keyed | session | tool.call.toolview | Interactive Package-owned region rendered inside the latest eligible `cordis_run` card in the conversation flow. | — |
| `conversation.chat.commandview` | ≤ 0.1.0-rc.7 | keyed | session | conversation.chat.node | Command row keyed by the command name. | — |
| `conversation.chat.message.images` | 0.2.1-alpha.3 | single | session | conversation.chat.node | Renderer for one consecutive group of durable message images. | — |
| `conversation.chat.reasoning.body` | 0.2.1-alpha.2 | single | session | conversation.chat.node | Expanded reasoning body with the unchanged model text. | — |
| `conversation.composer.bar` | ≤ 0.1.0-rc.7 | single | session-maybe | conversation.content | Resident composer body, including the no-Session inert state. | — |
| `conversation.composer.dock` | ≤ 0.1.0-rc.7 | list | session | conversation.composer.bar | Ambient entries below the composer card. | 输入框下方 chip |
| `conversation.input.left` | ≤ 0.1.0-rc.7 | list | session | conversation.composer.bar | Compact controls at the left of the composer tool row. | composer 左侧按钮 |
| `conversation.input.right` | ≤ 0.1.0-rc.7 | list | session | conversation.composer.bar | Compact controls before the composer submit action. | composer 右侧按钮 |
| `conversation.input.overlay` | ≤ 0.1.0-rc.7 | list | session | conversation.composer.bar | Floating entries rendered inside the resident composer card. | — |
| `conversation.input.attachments` | 0.1.0-rc.8 | single | session-maybe | conversation.composer.bar | Optional draft-attachment rail and drop target. | — |
| `conversation.input.permission` | 0.1.6-alpha.1 | single | session | conversation.composer.bar | Current-session permission control inside the composer tool row. | — |
| `conversation.input.model` | ≤ 0.1.0-rc.7 | single | session | conversation.composer.bar | Model selector inside the composer tool row. | — |
| `conversation.input.model.label` | 0.2.1-alpha.5 | single | session | conversation.input.model | Non-interactive inline model label; selection controls remain owner-managed. | — |
| `conversation.input.plan` | ≤ 0.1.0-rc.7 | single | session | conversation.composer.bar | Plan control inside the composer tool row. | — |
| `conversation.input.activity` | 0.1.7-alpha.1 | single | session | conversation.composer.bar | Compact action after the model selector; it can expand across the toolbar while retaining the editor and submit action. | — |
| `conversation.hero.brand.mark` | 0.1.0-rc.8 | single | root | conversation.content | Brand mark shown before the blank-session headline. | — |
| `conversation.hero.agentPreset` | ≤ 0.1.0-rc.7 | single | session-maybe | conversation.content | Agent-preset control staged for a New Session. | — |
| `conversation.chat.user.images` | 0.2.1-alpha.3 | single | session | conversation.chat.user.content | User-message images, including pending and local-echo previews, independently replaceable from output images. | — |

## Factories

Factory 是拥有者渲染的子界面，不是插件注册点；通常注册它下面声明的 Slot。

| Factory | 版本 | 作用域 | 说明 |
| --- | --- | --- | --- |
| `conversation.images.content` | ≤ 0.2.1-alpha.3 | root |  |
| `workspace.toast.content` | ≤ 0.2.1-alpha.3 | root |  |
| `conversation.user.text` | ≤ 0.2.1-alpha.3 | session |  |
| `conversation.content` | ≤ 0.1.6-alpha.2 | session-maybe |  |
| `conversation.chat.reasoning.content` | ≤ 0.2.1-alpha.2 | root |  |
| `conversation.chat.user.content` | ≤ 0.2.1-alpha.3 | session |  |

## Theme tokens

全部通过 CSS 变量使用；覆盖时同时给出 light/dark。

| 令牌 | 说明 |
| --- | --- |
| `--dsw-alias-bg-base` | Application base background. |
| `--dsw-alias-bg-layer-1` | Primary raised surface background. |
| `--dsw-alias-bg-layer-2` | Secondary nested surface background. |
| `--dsw-alias-bg-overlay` | Overlay and popover background. |
| `--dsw-alias-border-l1` | Primary subtle border. |
| `--dsw-alias-border-l2` | Secondary stronger border. |
| `--dsw-alias-brand-primary` | Primary brand accent. |
| `--dsw-alias-label-primary` | Primary text color. |
| `--dsw-alias-label-secondary` | Secondary text color. |
| `--dsw-alias-state-error-primary` | Primary error state color. |
| `--dsw-alias-state-idle-primary` | Primary inactive state color. |
| `--dsw-alias-state-success-primary` | Primary success state color. |
| `--dsw-alias-state-warn-primary` | Primary warning state color. |
| `--dsw-specific-sidebar-fill` | Sidebar column and title-row background. |

## 分布式 Demo 对照

本轮不是总览页，而是把 demo 放进 Slot 的真实位置；46 个可增量 Slot（15 原有 + 18 A + 10 C + 0.2.1-rc.3 新增 3 个 actions slot）已全部实现，入口标题统一为 `图鉴demo · <slot-key>`。下表只列核心入口，完整 46 项矩阵见 `docs/slot-demos.md`。

| Slot | demo 落点 | 注册方式 |
| --- | --- | --- |
| `conversation.view` | 会话 View 标签栏 tab | list + 新 id |
| `conversation.session.header.utilities` | 会话右上角按钮 | list + 新 id |
| `sidebarRightTabs.register` + `sidebar.right.pane.tab` | 原生右侧栏 tab | registry + keyed body |
| `conversation.composer.dock` | 输入框下方 chip | list + 新 id |
| `conversation.input.left` | composer 左侧按钮 | list + 新 id |
| `conversation.input.right` | composer 右侧按钮 | list + 新 id |
| `conversation.chat.assistant-actions` | assistant 消息动作 | list + 新 id |
| `conversation.chat.turnTail` | Turn 结束行 | list + 新 id |
| `sidebar.session.row.leading` | Session 行前徽标 | list + 新 id |
| `sidebar.footer.action` | 侧栏底部动作 | list + 新 id |
| `settings.section` | Settings 整页 | list + 新 id |
| `settings.general.item` | General 偏好行 | list + 新 id |
| `settings.plugins.tab` | Plugins 设置 tab | list + 新 id |
| `shell.overlay` | 详情弹层 / Toast | list + 新 id |
| `conversation.hero.options` | New Session Hero 选项 | list + 新 id |
| `sidebar.panellist.actions` | 左侧栏「更多」菜单行 | list + 新 id（0.2.1-rc.3） |
| `conversation.session.header.views.actions` | 会话头部 View「更多」菜单行 | list + 新 id（0.2.1-rc.3） |
| `sidebar.right.tab.guide.actions` | 右侧栏起始页「更多」菜单行 | list + 新 id（0.2.1-rc.3） |

小入口（header、input、session row、footer）用紧凑标签 + 完整 `title`/`aria-label`；tab/页面/列表项直接显示完整 `图鉴demo · <slot>`。所有小入口的详情由 `shell.overlay` 弹层展示。

## 重新扫描

在 DSH 会话里让 Agent 调用：

```text
cordis_inspect_list
cordis_inspect_query { platform: "host", provider: "Service" }
cordis_inspect_query { platform: "host", provider: "Event" }
cordis_inspect_query { platform: "client", provider: "Slots" }
cordis_inspect_query { platform: "client", provider: "Theme" }
```

把结果写回 `.scan/`，然后：

```sh
node scripts/build-versions.cjs
node scripts/build-catalog.cjs
node scripts/build-docs.cjs
node scripts/build-interfaces.cjs
node scripts/build-non-ui.cjs
```

## 已知边界

- 目录是静态快照；运行时 `ctx.get("service")` 可能返回 `undefined`，必须判空。
- 46 个可增量 Slot（15 原有 + 18 A + 10 C + rc.3 新增 3）已全部实现；B 类 57 + Factory 6 属于不可增量/不可见，不注册。
- Inspect 的 Client Service 目录是 “catalogued” 子集：`ctx.commandUi`（ui-commands）、`ctx.sidebarRight` / `ctx.sidebarRightTabs`（ui-sidebar-right）等服务不在快照里，但包内确实提供；本项目直接消费了它们。
- 不是每个 Slot 都适合直接塞 demo：`main`、`sidebar`、`rightbar.session` 等 single/replace 型 Slot 会替换内置 UI，本示例不占用。
- 原生右侧栏的 tab 列表是 registry，不是 Slot；`sidebar.right.pane.tab` 只渲染 body。加列表项必须用 `ctx.sidebarRightTabs.register`。
- `settings.section` / `settings.general.item` / `settings.plugins.tab` / `conversation.hero.options` 只在对应界面挂载时由 `slots.inject` 注册；这是预期行为。
- 本示例没有声明 `Config` schema（需要 `@deepseek-ai/schemastery`），所以插件详情没有配置表单；`apply` 仍会收到 patch 行里的 `config` 对象。
- UI 视觉验证受当前环境限制：已确认 15 个 Slot occupant、原生右侧栏 body、Host 路由、HMR 加载；具体像素表现请在 Web UI 中查看。
