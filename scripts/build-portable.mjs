import { mkdir, readFile, writeFile, copyFile, chmod } from 'node:fs/promises';

// Git installs pack the repository root rather than its workspaces.
// Ship the exact local core alongside the server, avoiding npm's unpatched kosis-cli.
const root = new URL('../', import.meta.url);
const out = new URL('build/', root);
await mkdir(out, { recursive: true });
let server = await readFile(new URL('packages/kosis-mcp/build/server.js', root), 'utf8');
for (const module of ['client', 'services']) {
  const specifier = `"kosis-cli/${module}"`;
  if (!server.includes(specifier)) throw new Error(`Missing core import: ${specifier}`);
  server = server.replaceAll(specifier, `"./${module}.js"`);
  await copyFile(new URL(`packages/kosis-cli/build/${module}.js`, root), new URL(`${module}.js`, out));
}
await writeFile(new URL('server.js', out), server);
await chmod(new URL('server.js', out), 0o755);
