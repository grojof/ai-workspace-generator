# Spec — Simple/Advanced wizard modes

## R1 — Explicit setup mode
`init` MUST offer Simple vs Advanced, with `--simple`/`--advanced` to skip the prompt and `--yes` ⇒ Simple.

- **Given** `init --advanced`, **then** the full current sequence runs.
- **Given** `init --simple` (or `--yes`), **then** no advanced prompts are asked.
- **Given** plain `init` (TTY), **then** the first prompt is the mode (Simple preselected).

## R2 — Simple path
Simple MUST ask only name, language, targets, and acceptance of the detected stack; everything else uses
documented defaults.

- **Given** a repo with a detected stack, **when** Simple runs, **then** the detected languages/frameworks/
  environments are shown and used on acceptance (no per-item multiselect).
- **Given** Simple, **then** defaults apply: purpose=build, sdd enabled + files + sdd, livingDocs on,
  context7 on, company=none, safetyGuard new→warn / existing→off, skills=all recommended (empty list).

## R3 — Advanced path unchanged
Advanced MUST reproduce today's behavior (same prompts, same resulting config for the same answers).

## R4 — Shared, testable assembly
Config assembly MUST be a pure function `buildConfig(inputs, detected)` used by both paths.

- **Given** simple-default inputs, **when** `buildConfig` runs, **then** it returns a valid normalized Config
  matching the documented defaults.
- **Given** advanced-like inputs, **when** `buildConfig` runs, **then** the resulting Config matches what the
  pre-refactor wizard produced for the same answers.

## Acceptance
Simple yields a valid workspace from minimal input; Advanced is unchanged; `buildConfig` is unit-tested for
both modes; build + full suite green.
