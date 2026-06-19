# Proposal — Simple/Advanced wizard modes

## Intent
Make `ai-workspace init` **intuitive by sections**: an explicit **Simple** path (few questions, smart
defaults, accept detected stack) and an **Advanced** path (fully parametrized — today's full flow). The
AI-guided `configure-workspace` skill remains the top recommendation; this improves the manual fallback.

## Scope
- Add an upfront **Setup mode** prompt: `Simple (recommended)` vs `Advanced`. CLI flags `--simple` /
  `--advanced` skip the prompt; `--yes` implies Simple with defaults (non-interactive).
- **Simple** asks only: project name (detected default), docs language, targets — then **shows the detected
  stack and asks to accept it** — and uses best-practice defaults for everything else (purpose=build,
  sdd=on/files/sdd, livingDocs=on, context7=on, company=none, safetyGuard: new→warn/existing→off, skills=all
  recommended).
- **Advanced** keeps the current full sequence unchanged.
- Refactor the config assembly into a **pure, testable** `buildConfig(inputs, detected)` shared by both
  paths (no behavior change for advanced).

## Out of scope
- AI-guided flow (already shipped), per-repo generation, broader de-hardcode.

## Risks
- The interactive flow has no unit tests → mitigate by extracting `buildConfig` (pure) and testing it for
  both simple defaults and an advanced-like input, keeping the advanced assembly byte-identical.

## Acceptance
- `init --simple` (or choosing Simple) produces a valid config from name + language + targets + accepted
  detected stack, with documented defaults, and generates a working workspace.
- `init --advanced` reproduces today's behavior.
- `buildConfig` is covered by unit tests for both modes.
