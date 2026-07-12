---
name: buildos-safe-change-lifecycle
description: 'Implement BuildOS changes with backward compatibility, proper test coverage, and deployability review. Use for feature changes, bug fixes, refactors, endpoint updates, or any request to ensure existing code does not break and run full-app verification.'
argument-hint: 'Describe the requested change and constraints'
user-invocable: false
disable-model-invocation: false
---

# BuildOS Safe Change Lifecycle

Use this skill to execute code changes in BuildOS using a best-practice workflow that prioritizes correctness, compatibility, test reliability, and deployment readiness.

## When To Use
- User asks for a code change and says "best practice", "properly", "backward compatible", "test it", or "deployable".
- The change can affect API contracts, data shape, status mappings, routing, or persistence behavior.
- You need a complete engineering path: implement, verify, review, and provide release confidence.

## Inputs
- Requested change and expected behavior.
- Constraints: compatibility requirements, files/features in scope, and acceptance checks.

## Workflow
1. Identify scope and blast radius.
2. Confirm compatibility constraints and non-negotiables.
3. Implement minimal, focused edits.
4. Run targeted tests first.
5. Run full app verification.
6. Perform deployability review.
7. Report outcomes with risks and next actions.

## Step 1: Scope And Blast Radius
1. Map affected layers: frontend, backend, API contracts, DB schema, build scripts.
2. Detect impacted shared contracts:
   - API envelope expectations (`{ success, data, total, limit, skip }` where applicable).
   - Status/state mappings used by multiple views.
   - Date/serialization formats consumed by Prisma and clients.
3. Create a short impact statement before editing.

Decision points:
- If API response shape may change, keep previous shape or add additive fields only.
- If DB schema changes are required, add migration-safe defaults and preserve existing readers.

## Step 2: Compatibility Guardrails
1. Preserve public interfaces and route behavior.
2. Avoid breaking renames unless all call sites are updated in one pass.
3. Prefer additive changes over destructive changes.
4. Keep existing config keys and localStorage keys stable unless migration logic is added.

Compatibility checks:
- Existing pages/components compile without code changes outside declared scope.
- Existing endpoint consumers still parse responses.
- Existing seed/dev flows still start.

## Step 3: Implementation
1. Edit only necessary files; keep diff focused.
2. Follow existing patterns and utility helpers already used in the repo.
3. Add concise comments only for non-obvious logic.
4. If behavior spans FE and BE, update both sides in the same change.

## Step 4: Targeted Verification
Run only relevant tests/checks first.

- Frontend type-check:
  - `./server/node_modules/.bin/tsc -p tsconfig.frontend.json --noEmit`
- Backend unit/integration tests:
  - `cd server && npx jest`
- Backend build:
  - `cd server && npm run build`
- Frontend build:
  - `pnpm build`

If a targeted check fails:
1. Fix root cause.
2. Re-run the failed check.
3. Re-run related checks impacted by the fix.

## Step 5: Full-App Verification
1. Run end-to-end project verification:
  - Root tests/workspace checks: `pnpm run test` (or nearest project-wide equivalent if scripts differ).
2. Run E2E or smoke validation for the affected user flow when an E2E framework or script exists:
  - Examples: `pnpm run test:e2e`, `npm run test:e2e`, or project-specific Playwright/Cypress smoke command.
3. If no single project-wide test exists, run:
  - Frontend type-check + build.
  - Backend tests + build.
  - At least one manual or automated smoke path for changed behavior.
4. Confirm no new errors in Problems diagnostics for touched files.

## Step 6: Deployability Review
Use this release checklist:
- Build passes for frontend and backend.
- Tests pass at targeted and full-app levels.
- No unintended API contract changes.
- No missing environment/config assumptions.
- No debug artifacts, dead code, or hardcoded secrets.
- Change is reversible and isolated.

Classify deployment confidence:
- `High`: all checks green, including E2E/smoke coverage for changed behavior, and no known risks.
- `Medium`: checks green but E2E/smoke coverage is partial or caveats remain.
- `Low`: unresolved issues or unverified critical paths.

## Step 7: Final Report Format
Provide:
1. What changed (files and purpose).
2. Compatibility guarantees and how they were protected.
3. Commands run and pass/fail summary.
4. Deployability confidence (`High`/`Medium`/`Low`) and residual risks.
5. Optional next steps.

## Quality Bar
A task is complete only if:
- Requested behavior is implemented.
- Backward compatibility is preserved or explicitly documented.
- Relevant targeted checks pass.
- Full-app verification passes.
- Deployability review is included.