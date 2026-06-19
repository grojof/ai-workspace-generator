---
name: sdd-audit-security
description: >
  Audit a REASONS spec/app against a catalogue of security controls (SEC-*). Trigger: security review or before approving a spec for deployment.
license: Apache-2.0
metadata:
  author: ai-workspace
  version: "1.0"
---
## sdd-audit-security — security audit (SEC-*)

Audit a `reasons` spec and its code against a catalogue of security controls. Cite findings by control ID.
The full `SEC-*` catalogue is an external reference (supply your own; not bundled here); the blocking
checks below are the most frequent rejects and must be verified first.

### Blocking checks
- **SEC-NET** — every outbound HTTP call declares an **explicit timeout** (SEC-NET-001 is the #1 reject);
  Profile B with a Node server binds 127.0.0.1 only (SEC-NET-003).
- **SEC-DATA** — `handles_personal_data: true` ⇒ §7.2 has legal basis, retention, data-subject rights, DPO
  (GDPR/LOPDGDD). No personal data in browser storage.
- **SEC-STOR** — browser `localStorage`/`sessionStorage` holds only non-personal preferences (SEC-STOR-001/002).
- **SEC-RUNTIME** — Profile B has no server-held secrets unless `runs_node_server: true`; then secrets live
  outside the package, loaded via env (SEC-RUNTIME-001/002).
- **SEC-DEPS** — dependencies scanned (uv audit / npm audit); no floating ranges on security-sensitive deps
  (SEC-DEPS-003/004).
- **SEC-XSS / SEC-CSP** — React/SPA paths apply the XSS and CSP rules (SEC-XSS-003/004, SEC-CSP-003).

### Output
A report listing each control checked, PASS/FAIL, and the spec/code location. All audits green is a
precondition for the `it-approved` status transition.
