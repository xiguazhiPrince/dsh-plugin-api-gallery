# Raw inspection snapshots

These files are the raw results of `cordis_inspect_query` against the running
DSH Host/Client. Current snapshot: **DSH 0.2.1-rc.3**, captured 2026-10-26 from a
freshly reloaded Web Client (the previous tab still ran the rc.2 client and does
not answer with the new Slot set).

They are inputs to `scripts/build-catalog.cjs`; the generated `catalog.json` is
what the plugin ships. Per-interface "since" versions come from
`version-since.json`, produced by `scripts/build-versions.cjs` (release-tag
catalogs under `.scan/upstream/`, gitignored and re-downloadable).

| File | Inspect call |
| --- | --- |
| `host-Service-listService.full.json` | `platform: host, provider: Service, method: listService` (no service) |
| `host-Event-listEvents.json` | `platform: host, provider: Event, method: listEvents` |
| `client-Service-listService.json` | `platform: client, provider: Service, method: listService` |
| `client-Event-listEvents.json` | `platform: client, provider: Event, method: listEvents` |
| `client-Builtin-listBuiltins.json` | `platform: client, provider: Builtin, method: listBuiltins` |
| `client-Theme-listTokens.json` | `platform: client, provider: Theme, method: listTokens` |
| `client-Slots-listSubTree.full.json` | `platform: client, provider: Slots, method: listSubTree` (no root) |

Re-capture them with the `cordis_inspect_query` tool, overwrite the files, then:

```sh
node scripts/build-versions.cjs --download   # optional: refresh since-version data (downloads release-tag catalogs)
node scripts/build-catalog.cjs
node scripts/build-interfaces.cjs
node scripts/build-non-ui.cjs
node scripts/build-docs.cjs
```
