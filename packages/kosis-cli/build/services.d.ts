/**
 * KOSIS 공유서비스 OpenAPI 서비스 정의 레지스트리.
 * CLI 서브커맨드와 MCP 도구가 모두 이 테이블에서 파생된다.
 * 파라미터명은 KOSIS 개발가이드의 영문 항목명을 그대로 쓴다(가이드와 1:1 대응).
 */
export interface ParamDef {
    /** KOSIS API 쿼리 파라미터명 (가이드 표기 그대로) */
    name: string;
    desc: string;
    required?: boolean;
    enum?: readonly string[];
}
export interface Resolved {
    endpoint: string;
    fixed: Record<string, string>;
}
export interface ServiceDef {
    /** CLI 서브커맨드명이자 MCP 도구명(kosis_ 접두 + _ 치환)의 근거 */
    id: string;
    desc: string;
    endpoint: string;
    /** 항상 붙는 고정 쿼리 파라미터 */
    fixed?: Record<string, string>;
    params: ParamDef[];
    /** 파라미터 조합 검증 — 문제 있으면 한국어 메시지, 통과면 null */
    validate?: (p: Record<string, string>) => string | null;
    /** 파라미터에 따라 엔드포인트가 달라지는 서비스의 선택 로직 */
    resolve?: (p: Record<string, string>) => Resolved;
}
export declare const VW_CODES: readonly ["MT_ZTITLE", "MT_OTITLE", "MT_CHOSUN_TITLE", "MT_HANKUK_TITLE", "MT_STOP_TITLE", "MT_ATITLE01", "MT_ATITLE02", "MT_GTITLE01", "MT_ETITLE"];
export declare const META_TYPES: readonly ["TBL", "ORG", "PRD", "ITM", "CMMT", "UNIT", "SOURCE", "WGT", "NCD"];
export declare const SERVICES: ServiceDef[];
export declare function getService(id: string): ServiceDef | undefined;
