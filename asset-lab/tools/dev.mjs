#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url), root = fileURLToPath(new URL("../../", import.meta.url));
const args = process.argv.slice(2), suppliedPort = args.indexOf("--port");
const port = suppliedPort >= 0 ? args[suppliedPort + 1] : "3101";
console.log(`Asset lab: http://127.0.0.1:${port}/asset-lab\nIndependent build directory: .next-lab`);
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--webpack", ...(!args.includes("--hostname") ? ["--hostname", "127.0.0.1"] : []), ...(suppliedPort >= 0 ? [] : ["--port", port]), ...args], { cwd: root, stdio: "inherit", env: { ...process.env, SPACEAPPS_ASSET_LAB: "1" } });
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 0; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
