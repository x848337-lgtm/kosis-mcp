import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

if (!process.env.KOSIS_API_KEY) {
  console.error('KOSIS_API_KEY is required in this process environment.');
  process.exit(1);
}
const client = new Client({ name: 'verify-local-kosis', version: '1' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [fileURLToPath(new URL('../packages/kosis-mcp/build/server.js', import.meta.url))],
  env: { KOSIS_API_KEY: process.env.KOSIS_API_KEY },
  stderr: 'ignore',
});
try {
  await client.connect(transport);
  const result = await client.callTool({ name: 'kosis_data', arguments: {
    orgId: '101', tblId: 'DT_1DA7002S', itmId: 'T80', objL1: '00',
    prdSe: 'Y', startPrdDe: '2023', endPrdDe: '2025',
  } });
  if (result.isError) throw new Error('MCP tool failed');
  const rows = JSON.parse(result.content.find(c => c.type === 'text').text);
  if (rows.length !== 3 || rows.some(r => r.ITM_ID !== 'T80' || r.C1 !== '00'))
    throw new Error('Unexpected data');
  for (const row of rows.sort((a, b) => a.PRD_DE.localeCompare(b.PRD_DE)))
    console.log(`${row.PRD_DE}: ${row.DT}${row.UNIT_NM}`);
} catch {
  // Avoid printing authenticated URLs that transport errors might contain.
  console.error('Verification failed. Check the KOSIS key, expiry and network access.');
  process.exitCode = 1;
} finally {
  await client.close();
  await transport.close();
}
