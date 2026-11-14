import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { SOURCE_FILES } from "../../../../../asset-lab/core/package.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const exec = promisify(execFile);
export async function GET() {
  try {
    const root = process.cwd();
    const files = await Promise.all(SOURCE_FILES.map(async (file) => ({ path: file, sha256: createHash("sha256").update(await readFile(path.join(root, file))).digest("hex") })));
    let gitCommit: string | null = null, dirty = true;
    try {
      const options = { cwd: root, timeout: 1500, env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } };
      const [head, status] = await Promise.all([exec("git", ["rev-parse", "HEAD"], options), exec("git", ["status", "--porcelain", "--", ...SOURCE_FILES], options)]);
      gitCommit = head.stdout.trim(); dirty = !!status.stdout.trim();
    } catch { /* Exact file hashes still identify a source checkout without Git. */ }
    const recipe = JSON.parse(await readFile(path.join(root, "src/assets/recipes/lunar-surface.json"), "utf8"));
    return Response.json({ source: { gitCommit, dirty, files }, recipe }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "The lab needs a local checkout containing its source files." }, { status: 503 }); }
}
