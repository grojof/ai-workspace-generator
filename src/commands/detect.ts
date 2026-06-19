import { detectStack, type DetectedStack } from "../detect/stack.js";

/**
 * `detect` — print the deterministic stack detection without writing anything. `--json` emits the raw
 * `DetectedStack` so the `configure-workspace` skill (and other tooling) can use it as a reliable seed.
 */
export function runDetect(cwd: string, opts: { json?: boolean } = {}): void {
  const detected: DetectedStack = detectStack(cwd);
  if (opts.json) {
    process.stdout.write(`${JSON.stringify(detected, null, 2)}\n`);
    return;
  }
  const fmt = (arr: { id: string; version?: string }[]) =>
    arr.map((x) => (x.version ? `${x.id}@${x.version}` : x.id)).join(", ") || "—";
  console.log(`Languages:    ${fmt(detected.languages)}`);
  console.log(`Frameworks:   ${fmt(detected.frameworks)}`);
  console.log(`Environments: ${fmt(detected.environments)}`);
  if (detected.runtime) console.log(`Runtime:      ${detected.runtime}`);
  if (detected.notes.length) console.log(`\n${detected.notes.map((n) => `- ${n}`).join("\n")}`);
}
