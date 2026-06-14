<!-- Gracias por contribuir / Thanks for contributing. See CONTRIBUTING.md -->

## What & why

<!-- Describe the change and the motivation. -->

## Checklist

- [ ] `npm run build` is clean and `npm test` passes.
- [ ] A second `sync` on a scratch repo is idempotent (0 created, 0 updated).
- [ ] Text outside `ai-workspace:begin/end` markers is preserved.
- [ ] Bundled modules (lang/framework/environment) have **base + Spanish** templates.
- [ ] Bumped `TEMPLATES_VERSION` in `src/version.ts` **if** generated output changed.
- [ ] Documented any renamed/removed managed-block id (migration), per MAINTAINING.
- [ ] Updated the matching docs (`docs/` and `docs/es/`).
