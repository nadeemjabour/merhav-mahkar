# Private research task MCP

`POST /mcp` implements stateless JSON-RPC, with MCP 2026-07-28 discovery and compatibility initialization. The hosting manifest preserves the existing project ID, R2 binding and audience and adds only the `mcp` capability.

## Current records

The adapter calls the same `load(env)` function as `/api/state` on every data request. It reads `BUCKET.get('state.json')`, including `tasks`, `papers` and `rev`. Creation uses the app's `saveRecord` task builder and conditional `save` function on that same object. No migration, browser-storage dependency, separate task copy or cached task index is introduced. Test snapshots are outside this repository and never used by the deployed Worker.

## Tools

- `list_research_projects`: IDs/names to use in filters.
- `list_research_tasks`: project ID/name, status, priority, exact due date, inclusive date range, dated/undated, limit and offset.
- `search_research_tasks`: the same filters plus an AND text query over title, description and project name.
- `get_research_task`: one exact ID.
- `create_research_task`: only for an explicit user request, with an existing project ID, title, optional description/date/priority/initial status, and a required idempotency key. English aliases and stored Hebrew values are accepted; defaults are normal priority and todo status. Description is stored in the app's existing remaining-work field, or completed-work field for completed tasks, so it is visible in the task editor.

Task output is an explicit field allowlist: ID/title, project ID/name, due date, priority/status, available description, start date, work status, assignee, chapter/dependency IDs and update timestamp. Empty fields are null. Results include the current state revision. The four read tools remain read-only. Creation is annotated as a non-destructive, idempotent write; no edit/delete operation is registered.

## Idempotent creation

The receipt and task are committed in one conditional ETag write to `state.json`. Receipt keys are SHA-256 hashes scoped to the verified Site user ID, email and caller-provided operation key; the canonical payload fingerprint and resulting task ID are stored in `mcpTaskCreates`. Normal retries never expire or evict receipts. Same key and equivalent normalized inputs returns the existing task; a changed payload is rejected. Concurrent app edits trigger a fresh read and bounded retry without overwriting their work. A missing original task is reported rather than recreated. If a write acknowledgement is lost, the reader checks the receipt; if the outcome cannot be confirmed, the caller is instructed to retry with the same key. Successful responses distinguish `created` and `replayed`.

Receipts are part of the existing state and full backup. As with research records themselves, explicitly restoring a backup predating an operation can rewind its receipt history; this does not add a second receipt database or alter existing restore behavior.

## Identity

Sites dispatch authenticates requests and enforces the existing Site audience. Data calls additionally require a Site-scoped `oai-authenticated-user-id` and verified `oai-authenticated-user-email` matching the owner configured in the `MCP_OWNER_EMAIL` runtime secret. The task responsibility field is not treated as account ownership: these are the authenticated owner's private Site records. Missing identity, another account, or an unset owner configuration fails closed.

Discovery and tool schemas contain no research data and do not read storage. Identity-less service access cannot call a task data tool. The runtime owner secret is managed through Sites, never included in client HTML or this repository. Sites authentication headers are trusted only behind Sites dispatch.

## Validation

Run `node build.cjs`, `node test-mcp.cjs`, `node test-create-mcp.cjs` and `node test-cloud.cjs`. Read tests cover filters, inclusive dates, undated tasks, pagination, invalid dates, unknown IDs/tools, missing/wrong owner and live reload. Creation tests use isolated in-memory R2 storage only: app visibility, defaults, input validation, status/description mapping, repeated and 12 simultaneous same-key requests, different-key concurrency, changed-payload rejection, concurrent app edits, outage/recovery, acknowledgement loss and owner rejection. No live test task is created. Optional `RESEARCH_MCP_SNAPSHOT` points to a local current-record snapshot for read verification only.

Publication provisions/refreshes the Site plugin. Successful publication alone does not prove installation or connection in ChatGPT; verify a call through the actual plugin before claiming connection.
