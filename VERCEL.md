# Vercel deployment

Production: https://merhav-mahkar-wine.vercel.app/

The Vercel project must build with `node build-vercel.cjs`. The public output
directory is `public`; all application routes are handled by
`api/workspace.mjs`. A successful upload of this repository without that build
and route configuration produces a 404, because the original build targeted
Cloudflare Workers.

Configure the values in `.env.example` in Vercel. No service-role key is used.
All Supabase database and Storage requests carry the signed-in user's token.
Supabase validates the user on every request; database policies additionally
require a workspace membership. Session cookies are HttpOnly, Secure on HTTPS,
SameSite=Lax, and responses are never cached. POST requests require the same
origin. The original Sites migration and MCP endpoints are disabled on Vercel.

Apply `supabase/migrations/20261126_runtime.sql` after the private import schema.
The normalized tables retain the verified import snapshot. The existing app's
atomic state and conversations are stored in `workspace_runtime_objects`;
updates use optimistic concurrency so another tab's changes are not overwritten.
The app's active state is this runtime document, not the import snapshot tables.
Private file bytes remain in `research-files`, scoped under the workspace ID.
Seed the runtime state privately from the source backup; never commit it here.

An administrator must preapprove each account in `workspace_access_grants`.
The claim function checks the signed-in user's confirmed email in Supabase Auth.
Creating an account alone never grants access. Configure Supabase's Site URL and
allowed redirect URL to the production host and `/auth/confirmed`, respectively.
Users create their own passwords in the app and confirm their email.

The app retains its existing report generation and statistics engine. Vercel
Functions impose request/response limits; larger backup transfers and files
need a direct-to-private-Storage upload/download flow rather than increasing
the application's former 50 MB limit. The migration upload uses Storage directly.

Validate with `node build-vercel.cjs` and `node --test test-vercel.mjs`.
The tests cover anonymous access, membership, read-only users, CSRF, cookie
security, refresh, concurrency, initialization and storage path isolation.
