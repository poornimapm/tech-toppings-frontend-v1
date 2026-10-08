# Architecture Decision Records

ADRs that span both repositories live in the backend repo, so there is one source of truth:
<https://github.com/poornimapm/tech-toppings-backend-v1/tree/develop/docs/adr>.

These ADRs shape the frontend directly:

| ADR  | Decision                                      | Frontend impact                                                                                      |
| ---- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 0001 | Modular monolith with manifest auto-discovery | `src/modules/<key>/manifest.ts` via `import.meta.glob` (Phase 3)                                     |
| 0003 | Auth tokens + same-origin API access          | Access token kept in memory; refresh token in an httpOnly cookie; the API is always called at `/api` |
| 0006 | Hosting on Cloudflare Pages                   | `functions/api/[[path]].ts` proxy and `_headers` (Phase 12)                                          |
| 0008 | API types generated from OpenAPI              | `npm run gen:api` creates `src/core/api/schema.d.ts`                                                 |
| 0009 | i18n via codes, translated on the client      | `errors` namespace; `errorKey()`                                                                     |
| 0010 | Offline capture + idempotent sync             | IndexedDB queue (Phase 11)                                                                           |

Frontend-only decisions are recorded here as `F-NNNN-*.md` once they come up.
