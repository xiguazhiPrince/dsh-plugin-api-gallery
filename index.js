/**
 * Host half of dsh-plugin-api-gallery.
 *
 * The visible plugin is a set of distributed Slot demos in `client.js`.
 * This half only exposes one read-only JSON snapshot so the settings page and
 * the native right-sidebar tab can show real Host data:
 *
 *   ctx.webServer.register   same-origin GET /plugin-api-gallery/state
 *   ctx.effect               ownership + route cleanup
 *   ctx.get('agents'|'sessions'|'workingDirectory'|'goals'|'schedule'|'tools')
 *                            optional-service reads
 *
 * This half serves the read-only state/non-ui JSON and registers the two
 * demo capabilities (`api_gallery_demo` tool, `/api-gallery` command) that
 * make the keyed tool/command view Slots dispatchable.
 */
import { readFileSync } from 'node:fs';

const PLUGIN_ID = 'dsh-plugin-api-gallery';
const ROUTE_PREFIX = '/plugin-api-gallery';
const STATE_CACHE_MS = 1500;
let nonUiCache = null;
let nonUiCacheAt = 0;

function readNonUiText() {
  const now = Date.now();
  if (nonUiCache !== null && now - nonUiCacheAt < 1000) return nonUiCache;
  nonUiCache = readFileSync(new URL('./non-ui-slots.json', import.meta.url), 'utf8');
  nonUiCacheAt = now;
  return nonUiCache;
}

const startedAt = Date.now();
let cachedState = null;
let cachedAt = 0;

function shortText(value, limit = 160) {
  const text = typeof value === 'string' ? value : String(value ?? '');
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function trustedRequest(ctx, request) {
  const authority = String(request.headers.host ?? '');
  if (authority === '') return false;
  const withoutPort = authority.startsWith('[')
    ? authority.slice(0, authority.indexOf(']') + 1)
    : authority.replace(/:\d+$/, '');
  const hostname = withoutPort.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1') return true;

  const webRuntime = ctx.get('webRuntime');
  const trustedHosts = webRuntime && Array.isArray(webRuntime.trustedHosts) ? webRuntime.trustedHosts : [];
  return trustedHosts.some((entry) => {
    if (typeof entry === 'string') return entry === authority || entry === withoutPort || entry === hostname;
    if (entry && typeof entry === 'object') return entry.host === authority || entry.host === withoutPort;
    return false;
  });
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  response.end(body);
}

async function readLiveSessions(ctx) {
  const agents = ctx.get('agents');
  const sessions = ctx.get('sessions');
  const directories = ctx.get('workingDirectory');
  const goals = ctx.get('goals');
  const schedule = ctx.get('schedule');

  const rows = [];
  for (const agent of agents === undefined ? [] : agents.list().slice(0, 6)) {
    const session = sessions === undefined ? undefined : sessions.get(agent.id);
    const cwd = session === undefined
      ? null
      : directories === undefined
        ? session.header?.cwd ?? null
        : directories.get(session);
    const row = {
      id: agent.id,
      cwd,
      parent: session?.header?.parentSession ?? null,
      goal: null,
      schedules: null,
    };
    if (goals !== undefined) {
      try {
        const view = goals.get(agent);
        row.goal = view === undefined ? null : { phase: view.phase, objective: shortText(view.objective, 80) };
      } catch (error) {
        row.goal = { error: shortText(error && error.message ? error.message : error) };
      }
    }
    if (schedule !== undefined) {
      try {
        const list = await schedule.list({ sessionId: agent.id });
        row.schedules = list.length;
      } catch {
        row.schedules = null;
      }
    }
    rows.push(row);
  }
  return rows;
}

function readToolSummary(ctx) {
  const tools = ctx.get('tools');
  if (tools === undefined) return [];
  const agents = ctx.get('agents');
  const agent = agents === undefined ? undefined : agents.list()[0];
  let schemas;
  try {
    // The model-visible set is scoped: an agent sees global + scoped tools.
    schemas = agent === undefined ? tools.schemas() : tools.schemas(agent);
  } catch {
    schemas = tools.schemas();
  }
  return schemas.map((schema) => ({
    name: schema.name,
    description: shortText(schema.description, 160),
  }));
}

async function buildState(ctx, config) {
  if (cachedState !== null && Date.now() - cachedAt < STATE_CACHE_MS) return cachedState;
  const state = {
    plugin: {
      id: PLUGIN_ID,
      startedAt,
      uptimeMs: Date.now() - startedAt,
      config: config ?? {},
    },
    server: {
      routePrefix: ROUTE_PREFIX,
      origin: (() => {
        try {
          return ctx.get('webServer')?.getOrigin() ?? null;
        } catch {
          return null;
        }
      })(),
      advertisedUrl: (() => {
        try {
          return ctx.get('webApp')?.getAdvertisedUrl() ?? null;
        } catch {
          return null;
        }
      })(),
    },
    services: {
      agents: ctx.get('agents') !== undefined,
      sessions: ctx.get('sessions') !== undefined,
      workingDirectory: ctx.get('workingDirectory') !== undefined,
      goals: ctx.get('goals') !== undefined,
      schedule: ctx.get('schedule') !== undefined,
      tools: ctx.get('tools') !== undefined,
      webServer: ctx.get('webServer') !== undefined,
      webApp: ctx.get('webApp') !== undefined,
    },
    sessions: await readLiveSessions(ctx),
    tools: readToolSummary(ctx),
  };
  cachedState = state;
  cachedAt = Date.now();
  return state;
}

export const name = PLUGIN_ID;
export const inject = ['webServer'];

/** A model-callable tool so `tool.call.toolview` has a dispatchable key. */
function registerDemoTool(ctx) {
  const tools = ctx.get('tools');
  if (tools === undefined) return;
  ctx.effect(
    () =>
      tools.register({
        name: 'api_gallery_demo',
        description:
          'Echo one message with the Host time. Registered by the Plugin API Gallery so the custom ' +
          'tool.call.toolview card has a tool name to dispatch.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            message: { type: 'string', description: 'Text to echo back.' },
          },
          required: ['message'],
        },
        output: {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              echo: { type: 'string' },
              at: { type: 'integer' },
            },
            required: ['echo', 'at'],
          },
          render(args, value) {
            return [{ type: 'text', text: `api_gallery_demo → ${value.echo}` }];
          },
        },
        isConcurrencySafe() {
          return true;
        },
        presentCall() {
          return { card: 'generic', title: 'API Gallery · tool.call.toolview demo' };
        },
        async execute(args) {
          return {
            echo: args && typeof args.message === 'string' ? args.message : '',
            at: Date.now(),
          };
        },
      }),
    'api-gallery: tool.call.toolview demo tool',
  );
}

/** A Host slash command so `conversation.chat.commandview` has a dispatchable name. */
function registerDemoCommand(ctx) {
  const commands = ctx.get('commands');
  if (commands === undefined) return;
  ctx.effect(
    () =>
      commands.register({
        name: 'api-gallery',
        description: 'Print the Plugin API Gallery demo pointer without sending a model request.',
        handler: () => ({
          kind: 'success',
          text: [
            'Plugin API Gallery demo command executed.',
            'This row is customised by the conversation.chat.commandview slot.',
            'Tool demo: api_gallery_demo',
            'Right sidebar tab: 图鉴demo · sidebarRightTabs.register',
          ].join('\n'),
        }),
      }),
    'api-gallery: commandview demo command',
  );
}

export function apply(ctx, config) {
  const handler = async (request, response) => {
    if (!trustedRequest(ctx, request)) {
      sendJson(response, 403, { error: 'untrusted host' });
      return;
    }
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.pathname === `${ROUTE_PREFIX}/state`) {
      try {
        sendJson(response, 200, await buildState(ctx, config));
      } catch (error) {
        sendJson(response, 500, { error: error && error.message ? error.message : String(error) });
      }
      return;
    }
    if (url.pathname === `${ROUTE_PREFIX}/ping`) {
      sendJson(response, 200, { ok: true, at: Date.now(), uptimeMs: Date.now() - startedAt });
      return;
    }
    if (url.pathname === `${ROUTE_PREFIX}/non-ui`) {
      const text = readNonUiText();
      response.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=60',
        'content-length': Buffer.byteLength(text),
      });
      response.end(text);
      return;
    }
    sendJson(response, 404, { error: 'not found', path: url.pathname });
  };

  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: ROUTE_PREFIX, handler }),
    'api-gallery: state route',
  );

  registerDemoTool(ctx);
  registerDemoCommand(ctx);
}
