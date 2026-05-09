# Project conventions

## Code style

- **No AI-style comments.** Don't write comments that narrate what the code does ("// fetch the user", "// loop through items"), restate the function name, or explain obvious operations. Don't write comments that reference the task, fix, or session ("// added to handle X", "// fix for issue Y").
- **Comments are for non-obvious WHY only.** A hidden constraint, a subtle invariant, a workaround for a specific bug, behavior that would surprise a reader. If removing a comment wouldn't confuse a future reader, don't write it.
- **No multi-line docstrings or JSDoc blocks.** One short line max if absolutely needed. Type signatures are the documentation.
- **Don't add error handling for things that can't happen.** Trust internal code and framework guarantees. Validate at system boundaries (user input, external APIs) only.
- **No backwards-compat shims, "removed X" comments, or unused `_var` placeholders.** If something is unused, delete it.

## File structure

- **Keep files under 200 lines** when reasonably possible. If a file grows past that, look for a natural seam (one cohesive concept per file) and split it.
- **One concern per file.** `lib/audio/` has separate files for ffmpeg wrappers, silence detection, and the chunking pipeline — don't bundle them just because they're related.
- **Public API via barrel files** (`index.ts`) when a directory exposes multiple modules. Internal helpers stay unexported.
- **Co-locate types with their primary consumer.** Cross-cutting types live in `lib/types.ts`. Module-internal types stay in the module file.

## Naming and organization

- Server-only code (anything importing `node:*`, `ffmpeg-static`, `openai`, `@anthropic-ai/sdk`) lives in `lib/` and is imported only from `app/api/*` route handlers.
- Client components are marked with `"use client"` and live in `components/`.
- Japanese identifiers are fine for domain types matching the 議事録 schema (`会議名`, `決定事項`, etc.) — they map to the user-facing format and are part of the spec.

## What not to introduce

- No premature abstractions. Three similar lines is better than a wrong abstraction.
- No feature flags, A/B toggles, or "v2 ready" hooks until v2 is actually being built.
- No DB, auth, queue, or telemetry layer for v1 — the spec says process-and-forget.
