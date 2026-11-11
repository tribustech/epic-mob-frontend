// Node 20 does not expand globs in `node --test`, and npm on Windows runs scripts via cmd (no shell glob).
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = readdirSync("tests").filter((f) => f.endsWith(".test.ts")).map((f) => `tests/${f}`);
const r = spawnSync(process.execPath, ["--test", "--import", "tsx", ...files], { stdio: "inherit" });
process.exit(r.status ?? 1);
