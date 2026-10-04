---
name: Codegen dom.iterable quirk
description: Fix for the api-spec codegen typecheck failing on Headers.entries().
---
Generated orval fetch helpers call `Headers.prototype.entries()`, which TypeScript only knows with the `dom.iterable` lib. The api-client-react tsconfig originally listed only `dom` + `es2022`, so `pnpm --filter @workspace/api-spec run codegen` failed its typecheck step the first time a request body was added.

**How to apply:** if codegen fails with "Property 'entries' does not exist on type 'Headers'", add `dom.iterable` to that tsconfig's `lib`; do not edit generated files.
