# Merhav Mahkar — Research Workspace

https://merhav-mahkar.vercel.app/

A Hebrew-first research workspace for managing research projects, chapters, tasks, files, research instruments, and statistical analyses.

## Included features

- Research projects, writing chapters, sources, files, tasks, backups, and archive workflows.
- CSV import, variable coding, composite measures, descriptive statistics, statistical tests, reliability analysis, and reports.
- Research instrument catalog and optional AI-assisted instrument matching by research variable.
- Word and spreadsheet exports.
- Cloudflare Worker backend with R2 storage and a research-task MCP endpoint.

## Documentation

- [Architecture, APIs, and workflow](ARCHITECTURE.md)
- [Research-task MCP integration](MCP_README.md)

## Source layout

- `app/` — browser interface, analysis modules, document generation, and local development server.
- `worker.js` — hosted application routes and storage operations.
- `mcp-tasks.cjs` — research-task MCP interface.
- `vendor/` — bundled document and ZIP libraries.
- `build.cjs` — generates the hosted Worker bundle.
- `.openai/hosting.json` — existing Sites deployment configuration.

## Build

From the repository root, run:

```sh
node build.cjs
```

The output is written to `dist/server/index.js`. Hosted deployment requires the configured Sites project and its `BUCKET` R2 binding. The application relies on private Sites access enforcement; configure authentication before deploying the Worker independently.

The optional instrument-matching integration requires a server-side `OPENAI_API_KEY`. Never commit secret values. Local development helpers retain some paths from the original Windows environment and may need adjustment on another machine.

This repository contains application source. Research datasets, uploaded documents, runtime databases, and credentials are not included. Publishing the source repository does not change access to the hosted research workspace.
