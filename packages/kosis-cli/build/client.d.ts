/**
 * KOSIS OpenAPI HTTP 클라이언트 — URL 조립, 호출, 오류 매핑.
 * 인증키는 호출 시점에만 URL에 붙이며 로그/오류 메시지에는 절대 노출하지 않는다.
 */
import type { Resolved, ServiceDef } from "./services.js";
export declare const BASE_URL = "https://kosis.kr/openapi/";
/** KOSIS 개발가이드 1.4 오류메시지 유형 */
export declare const ERR_HELP: Record<string, string>;
export declare class KosisError extends Error {
    readonly code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare function resolveEndpoint(def: ServiceDef, params: Record<string, string>): Resolved;
/** 필수/enum/조합 검증. 문제가 있으면 KosisError를 던진다. */
export declare function validateParams(def: ServiceDef, params: Record<string, string>): void;
/** apiKey를 제외한 호출 URL 생성 (디버그 출력용으로도 안전) */
export declare function buildUrl(def: ServiceDef, params: Record<string, string>): URL;
/**
 * jsonVD를 무시하는 엔드포인트 대비 — 따옴표 없는 키({err:"30"} 등)를 보정해 파싱 시도.
 * 실패하면 null (호출부가 원문 반환 판단).
 */
export declare function parseLenient(text: string): unknown | null;
/** KOSIS 오류 응답({err, errMsg}) 감지 — 배열/정상 객체면 null */
export declare function extractError(data: unknown): {
    code?: string;
    msg: string;
} | null;
export interface CallOptions {
    /** 미지정 시 KosisError — 호출부는 환경변수/옵션에서 받아 넘긴다 */
    apiKey?: string;
    timeoutMs?: number;
}
/**
 * 서비스 호출. JSON이면 파싱해 오류를 검사하고, JSON이 아니면(sdmx 등) 원문을 반환한다.
 */
export declare function callService(def: ServiceDef, params: Record<string, string>, opts: CallOptions): Promise<unknown>;
