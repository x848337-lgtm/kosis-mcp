/**
 * MCP stdio 서버 스모크 — initialize → tools/list 왕복으로 도구 노출을 검증.
 * 네트워크 불필요 (KOSIS 호출 전 단계만).
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";

const SERVER = fileURLToPath(new URL("../build/server.js", import.meta.url));

function handshake(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [SERVER], { stdio: ["pipe", "pipe", "ignore"] });
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("MCP 핸드셰이크 타임아웃"));
    }, 15_000);
    let buf = "";
    proc.stdout.on("data", (d: Buffer) => {
      buf += d.toString();
      for (const line of buf.split("\n")) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === 2) {
            clearTimeout(timer);
            proc.kill();
            resolve(msg.result.tools.map((t: { name: string }) => t.name));
            return;
          }
        } catch {
          /* 부분 라인 — 다음 청크 대기 */
        }
      }
    });
    proc.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    proc.stdin.write(
      '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}\n' +
        '{"jsonrpc":"2.0","method":"notifications/initialized"}\n' +
        '{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n',
    );
  });
}

describe("kosis-mcp 서버", () => {
  it("stdio 핸드셰이크 후 도구 10개를 노출한다", async () => {
    const tools = await handshake();
    expect(tools).toHaveLength(10);
    expect(tools).toContain("kosis_search");
    expect(tools).toContain("kosis_indicator_data");
  }, 20_000);
});

describe.skipIf(!process.env.KOSIS_API_KEY)("MCP → KOSIS 라이브 조회", () => {
  it("tools/call kosis_data로 요청한 3개 연도의 실업률을 반환한다", async () => {
    const client = new Client({ name: "kosis-regression", version: "1" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER],
      env: { KOSIS_API_KEY: process.env.KOSIS_API_KEY! },
      stderr: "ignore",
    });
    try {
      await client.connect(transport);
      const result = await client.callTool({ name: "kosis_data", arguments: {
        orgId: "101", tblId: "DT_1DA7002S", itmId: "T80", objL1: "00",
        prdSe: "Y", startPrdDe: "2023", endPrdDe: "2025",
      } });
      expect(result.isError).not.toBe(true);
      const content = result.content as { type: string; text?: string }[];
      const rows = JSON.parse(content.find((c) => c.type === "text")!.text!) as Record<string, string>[];
      expect(rows.map((r) => r.PRD_DE).sort()).toEqual(["2023", "2024", "2025"]);
      for (const row of rows) {
        expect(row.ITM_ID).toBe("T80");
        expect(row.C1).toBe("00");
        expect(row.UNIT_NM).toBe("%");
      }
    } finally {
      await client.close();
      await transport.close();
    }
  }, 40_000);
});
