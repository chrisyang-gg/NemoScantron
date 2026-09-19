#!/usr/bin/env node
/**
 * Alias for the developer red-team CLI.
 *
 *   npm run red-team -- --count 4
 *   npm run red-team -- --count 4 --apply
 */
import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["--import", "tsx", "scripts/red-team.ts", ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: process.cwd(),
});

child.on("exit", (code) => process.exit(code ?? 1));
