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

## Google sign-in

The sign-in page includes Google OAuth through Supabase. An administrator must
first enable Google under Supabase Authentication > Sign In / Providers. The
app reports that setup is pending while the provider is disabled.

1. Create a Web application OAuth client in Google Cloud. Its authorized
   redirect URI is `<SUPABASE_URL>/auth/v1/callback`, as shown in Supabase's
   Google provider settings.
2. Enter the client ID and secret directly in Supabase's Google provider
   settings, then enable the provider. Never put the client secret in the
   browser, repository or application environment.
3. Keep Supabase's Site URL on the production origin. Under Redirect URLs,
   allow `https://merhav-mahkar-wine.vercel.app/auth/callback?flow=*` and
   `http://127.0.0.1:4327/auth/callback?flow=*`. These patterns keep the
   callback path fixed while allowing the random flow query parameter.
   Add an equivalent path on each specific preview host only when testing it.
4. A Google account must use an email preapproved for the workspace. Google
   sign-in does not bypass the existing membership checks.

After a real, approved account has successfully signed in with Google, set
`GOOGLE_SIGN_IN_ONLY=true` in the local or Vercel environment and redeploy or
restart the application. The sign-in screen then offers Google only and the
app's password login and signup endpoints reject requests. Keep the setting
unset until the Google flow has been verified to avoid locking users out.
Supabase's email provider is a separate project setting; disabling it affects
other email-based authentication flows, so assess those before changing it.

The server uses PKCE with a separate, short-lived HttpOnly verifier cookie for
each sign-in attempt. It exchanges the code at `/auth/callback`, then sets the
same private session cookies used by password sign-in. Cancelled, expired or
incomplete callbacks return to the login form so the user can retry.

See [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
and [redirect URL configuration](https://supabase.com/docs/guides/auth/redirect-urls).

The app retains its existing report generation and statistics engine. Vercel
Functions impose request/response limits; larger backup transfers and files
need a direct-to-private-Storage upload/download flow rather than increasing
the application's former 50 MB limit. The migration upload uses Storage directly.

Validate with `node build-vercel.cjs` and `node --test test-vercel.mjs`.
The tests cover anonymous access, membership, read-only users, CSRF, cookie
security, refresh, concurrency, initialization, storage path isolation, and\nGoogle PKCE initiation, callback failures and post-login membership enforcement.
