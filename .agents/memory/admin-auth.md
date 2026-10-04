---
name: Admin access model
description: Why the analyst dashboard uses a shared access key instead of user accounts, and how to upgrade.
---
Rule: `/admin` and every `/api/admin/*` route require the `ADMIN_ACCESS_KEY` secret, sent as `Authorization: Bearer <key>` (the generated client's `setAuthTokenGetter`) or `X-Admin-Key`. Missing secret → 503, wrong key → 401.

**Why:** the dashboard holds respondent PII and the research team is a handful of people; a shared key gave a protected first build without onboarding flows. The user approved "password/env secret or Replit Auth" in the spec.

**How to apply:** keep the key server-side only. If the team needs per-person accounts or audit trails, replace the middleware with Clerk sign-in plus a server-side admin allowlist rather than adding more key logic.
