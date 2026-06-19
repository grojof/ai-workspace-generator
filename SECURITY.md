# Security Policy

`ai-workspace` is a local code generator: it reads `workspace.config.yaml` and writes files into your
repo. It does **not** run network services and the CLI never calls MCP servers itself. Still, generated
hooks, ignore files and instructions affect how an AI agent behaves in your project, so we take reports
seriously.

## Supported versions

The project is pre-release (`0.x`). Only the latest `main` is supported — please reproduce on `main`
before reporting.

## Reporting a vulnerability

**Do not open a public issue for security problems.**

- Preferred: open a private report via **GitHub Security Advisories**
  ([Security → Report a vulnerability](https://github.com/grojof/ai-workspace-generator/security/advisories/new)).
- Alternatively, email the maintainer at **guillermo.rojo.fdez@gmail.com** with steps to reproduce.

We aim to acknowledge within 5 working days and to agree on a disclosure timeline before any public
discussion. Thanks for helping keep the tool safe.
